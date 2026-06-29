import { Router } from 'express';
import { authenticate, validate } from '../shared/deps';
import { createBeneficiarySchema, updateBeneficiarySchema } from '../../schemas/beneficiary';
import * as beneficiaryController from '../../controllers/subscriber/beneficiary.controller';
import multer from 'multer';

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only PDFs, Word documents, and images are allowed.`));
    }
  },
});

const router = Router();

// Beneficiaries
router.post('/', authenticate, validate(createBeneficiarySchema), beneficiaryController.createBeneficiary);
router.get('/subscriber/:subscriberId', authenticate, beneficiaryController.getSubscriberBeneficiaries);
router.get('/:beneficiaryId/profile', authenticate, beneficiaryController.getBeneficiaryProfile);
router.put('/:beneficiaryId', authenticate, validate(updateBeneficiarySchema), beneficiaryController.updateBeneficiary);

// Medical Records Management
router.post('/:beneficiaryId/medical-records/upload', authenticate, (req: any, res: any, next: any) => {
  uploadMiddleware.single('file')(req, res, (err: any) => {
    if (err) {
      console.error('📄 [Medical Record Upload] Multer error:', err.message);
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, beneficiaryController.uploadMedicalRecord);
router.put('/medical-records/:recordId', authenticate, beneficiaryController.updateMedicalRecord);
router.delete('/medical-records/:recordId', authenticate, beneficiaryController.deleteMedicalRecord);

export default router;