import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../shared/deps';
import prisma from '../../core/database';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── Config from .env ─────────────────────────────────────────────────────────

const VISIT_IMAGE_MAX_COUNT = parseInt(process.env.VISIT_IMAGE_MAX_COUNT || '10', 10);
const VISIT_IMAGE_MAX_SIZE_MB = parseFloat(process.env.VISIT_IMAGE_MAX_SIZE_MB || '25');
const VISIT_IMAGE_ALLOWED_TYPES = (
  process.env.VISIT_IMAGE_ALLOWED_TYPES ||
  'image/jpeg,image/png,image/webp,image/heic,image/heif'
)
  .split(',')
  .map(t => t.trim());

// ─── Multer (memory storage) ──────────────────────────────────────────────────

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: VISIT_IMAGE_MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (VISIT_IMAGE_ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${VISIT_IMAGE_ALLOWED_TYPES.join(', ')}`));
    }
  },
});

// ─── Supabase client (lazy singleton) ─────────────────────────────────────────

let supabaseClient: any = null;
function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  supabaseClient = createClient(url, key);
  return supabaseClient;
}

/** Upload a buffer to Supabase Storage and return the public URL */
async function uploadToSupabase(buffer: Buffer, path: string, mimeType: string): Promise<string> {
  const supabase = getSupabase();
  const bucket = process.env.STORAGE_BUCKET || 'staff-documents';
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimeType, upsert: false });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Safely parse the imageUrls JSON string field → string array.
 *  Accepts the Prisma-generated type which may be string | string[] | null | undefined.
 */
function parseImageUrls(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw; // should not happen at runtime, defensive guard
  try { return JSON.parse(raw) as string[]; }
  catch { return []; }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/care-companion/visit-images/config
// Returns upload limits from .env. Mobile app fetches this once on screen
// mount so limits are never hardcoded in the app.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/config', authenticate, (_req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      maxImages: VISIT_IMAGE_MAX_COUNT,
      maxFileSizeMB: VISIT_IMAGE_MAX_SIZE_MB,
      allowedTypes: VISIT_IMAGE_ALLOWED_TYPES,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/care-companion/visit-images/:visitId
// Returns the current array of image URLs for a visit.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:visitId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const visitId = req.params.visitId as string;
    // Use findUnique with no select so we get the full model (avoids select type issues)
    const visit = await prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    res.json({ success: true, data: { imageUrls: parseImageUrls((visit as any).imageUrls) } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/care-companion/visit-images/:visitId
// Upload one image for a visit.
// Body: multipart/form-data, field "file"
// Response: { success, url, totalImages, maxImages }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:visitId', authenticate, uploadMiddleware.single('file'), async (req: AuthRequest, res: Response) => {
  const file = req.file;
  const visitId = req.params.visitId as string;
  const userId = req.userId!;

  console.log(`\n📸 [Visit Image Upload] visitId=${visitId} userId=${userId}`);
  console.log(`   file: ${file ? `${file.originalname} (${file.mimetype}, ${file.size}B)` : 'MISSING'}`);

  if (!file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

  try {
    // Fetch visit + CC (for authorisation check)
    const visit = await prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found.' });

    // Resolve the CC's userId for authorisation
    const cc = await prisma.careCompanion.findUnique({
      where: { id: visit.careCompanionId },
      select: { userId: true },
    });
    if (!cc) return res.status(404).json({ success: false, message: 'Care Companion not found.' });
    if (cc.userId !== userId) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this visit.' });
    }

    // Enforce max image count
    const existing = parseImageUrls((visit as any).imageUrls);
    if (existing.length >= VISIT_IMAGE_MAX_COUNT) {
      return res.status(400).json({
        success: false,
        message: `Maximum of ${VISIT_IMAGE_MAX_COUNT} images already reached for this visit.`,
      });
    }

    // Generate unique storage path: visits/{visitId}/{timestamp}_{uid}.ext
    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const uid = uuidv4().split('-')[0];
    const storagePath = `visits/${visitId}/${Date.now()}_${uid}.${ext}`;

    const publicUrl = await uploadToSupabase(file.buffer, storagePath, file.mimetype);

    // Append the new URL and persist
    const updated = [...existing, publicUrl];
    await prisma.visit.update({
      where: { id: visitId },
      data: { imageUrls: JSON.stringify(updated) },
    });

    console.log(`   ✅ Uploaded → ${publicUrl} (${updated.length}/${VISIT_IMAGE_MAX_COUNT})`);

    res.json({
      success: true,
      message: 'Image uploaded successfully.',
      url: publicUrl,
      totalImages: updated.length,
      maxImages: VISIT_IMAGE_MAX_COUNT,
    });
  } catch (err: any) {
    console.error('[visit-images] Upload error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Upload failed.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/care-companion/visit-images/:visitId
// Remove one image URL from the visit's imageUrls array.
// Body: { "url": "https://..." }
// Does NOT delete from Supabase storage (safety — admins may still need it).
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:visitId', authenticate, async (req: AuthRequest, res: Response) => {
  const visitId = req.params.visitId as string;
  const { url } = req.body as { url: string };
  const userId = req.userId!;

  if (!url) return res.status(400).json({ success: false, message: 'url is required in request body.' });

  try {
    const visit = await prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found.' });

    const cc = await prisma.careCompanion.findUnique({
      where: { id: visit.careCompanionId },
      select: { userId: true },
    });
    if (!cc || cc.userId !== userId) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this visit.' });
    }

    const existing = parseImageUrls((visit as any).imageUrls);
    const updated = existing.filter(u => u !== url);

    if (updated.length === existing.length) {
      return res.status(404).json({ success: false, message: 'Image URL not found in this visit.' });
    }

    await prisma.visit.update({
      where: { id: visitId },
      data: { imageUrls: JSON.stringify(updated) },
    });

    res.json({ success: true, message: 'Image removed.', totalImages: updated.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
