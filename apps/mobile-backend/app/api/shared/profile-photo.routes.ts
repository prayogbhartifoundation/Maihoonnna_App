import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../shared/deps';
import prisma from '../../core/database';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ─── Multer (memory storage) ──────────────────────────────────────────────────
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB — no size restriction as per user request
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images are allowed.`));
    }
  },
});

// ─── Supabase client (lazy singleton) ─────────────────────────────────────────
let supabaseClient: any = null;
function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  }
  supabaseClient = createClient(url, key);
  return supabaseClient;
}

/**
 * Upload buffer to Supabase and return public URL
 */
async function uploadToSupabase(
  buffer: Buffer,
  path: string,
  mimeType: string
): Promise<string> {
  const supabase = getSupabase();
  const bucket = process.env.STORAGE_BUCKET || 'staff-documents';

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Generate a unique storage path for a profile photo
 */
function generateProfilePath(entityType: string, entityId: string, originalName: string): string {
  const ext = originalName.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const uid = uuidv4().split('-')[0];
  return `profiles/${entityType}/${entityId}/${timestamp}_${uid}.${ext}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/profile-photo/upload
//
// Upload or update a profile photo for any authenticated user, or for a
// beneficiary managed by an authenticated subscriber.
//
// Form-data fields:
//   - file       : image file (required)
//   - targetType : 'self' | 'beneficiary' (default: 'self')
//   - targetId   : required when targetType = 'beneficiary'
// ─────────────────────────────────────────────────────────────────────────────
router.post('/upload', authenticate, uploadMiddleware.single('file'), async (req: AuthRequest, res: Response) => {
  const file = req.file;
  const userId = req.userId!;
  const targetType = (req.body.targetType as string) || 'self';
  const targetId = req.body.targetId as string | undefined;

  // DEBUG: log what we received
  console.log('\n📸 [Photo Upload] Incoming request:');
  console.log('   userId     :', userId);
  console.log('   targetType :', targetType);
  console.log('   targetId   :', targetId);
  console.log('   file       :', file ? `${file.originalname} (${file.mimetype}, ${file.size} bytes)` : 'MISSING');
  console.log('─────────────────────────────────────────\n');

  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }


  try {
    // Fetch the requesting user's role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        careCompanionProfile: true,
        beneficiaryProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let photoUrl: string;
    let updatedEntity: any;

    if (targetType === 'self') {
      // ── Upload profile photo for the authenticated user themselves ───────────
      const storagePath = generateProfilePath(user.role, userId, file.originalname);
      photoUrl = await uploadToSupabase(file.buffer, storagePath, file.mimetype);

      if (user.role === 'care_companion' && user.careCompanionProfile) {
        // CC: update CareCompanion.photo
        updatedEntity = await prisma.careCompanion.update({
          where: { id: user.careCompanionProfile.id },
          data: { photo: photoUrl },
          select: { id: true, name: true, photo: true },
        });
        // Also update User.profilePhoto for consistency
        await prisma.user.update({ where: { id: userId }, data: { profilePhoto: photoUrl } });
      } else if (user.role === 'beneficiary' && user.beneficiaryProfile) {
        // Beneficiary: update Beneficiary.photo
        updatedEntity = await prisma.beneficiary.update({
          where: { id: user.beneficiaryProfile.id },
          data: { photo: photoUrl },
          select: { id: true, name: true, photo: true },
        });
        await prisma.user.update({ where: { id: userId }, data: { profilePhoto: photoUrl } });
      } else {
        // Subscriber (and any other role): update User.profilePhoto
        updatedEntity = await prisma.user.update({
          where: { id: userId },
          data: { profilePhoto: photoUrl },
          select: { id: true, name: true, profilePhoto: true },
        });
      }

      return res.json({
        success: true,
        message: 'Profile photo updated successfully',
        url: photoUrl,
        data: updatedEntity,
      });
    }

    if (targetType === 'beneficiary') {
      // ── Subscriber uploading/updating a beneficiary's photo ──────────────────
      if (!targetId) {
        return res.status(400).json({ success: false, message: 'targetId is required for beneficiary upload' });
      }

      // Verify this beneficiary belongs to the subscriber
      const beneficiary = await prisma.beneficiary.findFirst({
        where: { id: targetId, subscriberId: userId, isActive: true },
        select: { id: true, name: true, photo: true },
      });

      if (!beneficiary) {
        return res.status(403).json({
          success: false,
          message: 'Beneficiary not found or does not belong to this subscriber',
        });
      }

      const storagePath = generateProfilePath('beneficiary', targetId, file.originalname);
      photoUrl = await uploadToSupabase(file.buffer, storagePath, file.mimetype);

      updatedEntity = await prisma.beneficiary.update({
        where: { id: targetId },
        data: { photo: photoUrl },
        select: { id: true, name: true, photo: true },
      });

      return res.json({
        success: true,
        message: `${beneficiary.name}'s photo updated successfully`,
        url: photoUrl,
        data: updatedEntity,
      });
    }

    return res.status(400).json({ success: false, message: `Unknown targetType: ${targetType}` });
  } catch (error: any) {
    console.error('[profile-photo] Upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile-photo/me
// Returns the current user's profile photo URL
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, profilePhoto: true, name: true, role: true },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
