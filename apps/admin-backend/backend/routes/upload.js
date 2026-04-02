const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const storageService = require('../services/storage');
const { generateDocumentPath } = require('../utils/fileHelper');
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../../../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

/**
 * POST /api/upload-document
 * Expects form-data with:
 * - staffProfileId (string)
 * - documentType (string, e.g., 'aadhaar_front', 'pan_card')
 * - file (file attachment)
 */
router.post('/', upload.single('file'), async (req, res) => {
  const { staffProfileId, documentType } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  if (!staffProfileId || !documentType) {
    return res.status(400).json({ success: false, message: 'staffProfileId and documentType are required fields' });
  }

  try {
    // 1. Generate unique key/path for the file object
    const fileKey = generateDocumentPath(staffProfileId, documentType, file.originalname);

    // 2. Upload file stream to our configured storage service (S3 or Supabase)
    const { url: fileUrl } = await storageService.upload(file.buffer, fileKey, file.mimetype);

    // 3. Save metadata to Prisma StaffDocument table. 
    // This assumes the PRISMA schema has staffDocument table with required fields
    // Ensure you handle updates if the document type already exists for this staff profile
    
    // We use upsert to create or replace the document of the same type for a given staff profile
    const documentRecord = await prisma.staffDocument.upsert({
      where: {
        staffProfileId_documentType: {
          staffProfileId: staffProfileId,
          documentType: documentType
        }
      },
      update: {
        fileName: file.originalname,
        fileKey: fileKey,
        fileUrl: fileUrl,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        updatedAt: new Date()
      },
      create: {
        staffProfileId: staffProfileId,
        documentType: documentType,
        fileName: file.originalname,
        fileKey: fileKey,
        fileUrl: fileUrl,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        isRequired: true // Defaulting to true, adjust based on logic
      }
    });

    res.status(200).json({
      success: true,
      data: documentRecord
    });
  } catch (error) {
    console.error('File upload flow failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during file upload',
    });
  }
});

/**
 * POST /api/upload-profile-photo
 * Expects form-data with:
 * - targetId (string, e.g., Beneficiary ID or User ID)
 * - type (string, 'beneficiary' or 'staff')
 * - file (file attachment)
 */
router.post('/profile-photo', upload.single('file'), async (req, res) => {
  const { targetId, type } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  if (!targetId || !type) {
    return res.status(400).json({ success: false, message: 'targetId and type are required' });
  }

  try {
    const { generateProfilePath } = require('../utils/fileHelper');
    const fileKey = generateProfilePath(targetId, type, file.originalname);
    const { url: fileUrl } = await storageService.upload(file.buffer, fileKey, file.mimetype);

    // Update the record with the photo URL
    if (type === 'beneficiary') {
      await prisma.beneficiary.update({
        where: { id: targetId },
        data: { photo: fileUrl }
      });
    } else if (type === 'staff') {
      // Check which staff record to update
      const user = await prisma.user.findUnique({
        where: { id: targetId },
        include: {
          careCompanionProfile: true,
          fieldManagerProfile: true,
          operationsManagerProfile: true
        }
      });

      if (user) {
        if (user.role === 'care_companion' && user.careCompanionProfile) {
          await prisma.careCompanion.update({ where: { id: user.careCompanionProfile.id }, data: { photo: fileUrl } });
        } else if (user.role === 'field_manager' && user.fieldManagerProfile) {
          await prisma.fieldManager.update({ where: { id: user.fieldManagerProfile.id }, data: { photo: fileUrl } });
        }
        // OperationsManagers don't have a photo field currently in schema, but we still handle the upload
      }
    }

    res.status(200).json({
      success: true,
      url: fileUrl
    });
  } catch (error) {
    console.error('Profile photo upload failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
