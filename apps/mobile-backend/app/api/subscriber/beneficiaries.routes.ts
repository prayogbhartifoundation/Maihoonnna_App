import { Router } from 'express';
import { authenticate, validate } from '../shared/deps';
import { createBeneficiarySchema, updateBeneficiarySchema } from '../../schemas/beneficiary';
import * as beneficiaryController from '../../controllers/subscriber/beneficiary.controller';

const router = Router();

// Beneficiaries
router.post('/', authenticate, validate(createBeneficiarySchema), beneficiaryController.createBeneficiary);
router.get('/subscriber/:subscriberId', authenticate, beneficiaryController.getSubscriberBeneficiaries);
router.get('/:beneficiaryId/profile', authenticate, beneficiaryController.getBeneficiaryProfile);
router.put('/:beneficiaryId', authenticate, validate(updateBeneficiarySchema), beneficiaryController.updateBeneficiary);

// Medical Records Management
router.put('/medical-records/:recordId', authenticate, beneficiaryController.updateMedicalRecord);
router.delete('/medical-records/:recordId', authenticate, beneficiaryController.deleteMedicalRecord);

export default router;