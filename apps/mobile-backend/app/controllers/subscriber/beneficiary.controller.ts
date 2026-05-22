import { Request, Response } from 'express';
import * as beneficiaryService from '../../services/subscriber/beneficiary_service';

export const getBeneficiaryProfile = async (req: Request, res: Response) => {
  try {
    const beneficiaryId = req.params.beneficiaryId as string;
    const profile = await beneficiaryService.getBeneficiaryProfile(beneficiaryId);
    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBeneficiary = async (req: Request, res: Response) => {
  try {
    const data = await beneficiaryService.createBeneficiary(req.body);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSubscriberBeneficiaries = async (req: Request, res: Response) => {
  try {
    const subscriberId = req.params.subscriberId as string;
    const list = await beneficiaryService.getSubscriberBeneficiaries(subscriberId);
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBeneficiary = async (req: Request, res: Response) => {
  try {
    const beneficiaryId = req.params.beneficiaryId as string;
    const data = await beneficiaryService.updateBeneficiary(beneficiaryId, req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error(`[updateBeneficiary Error] beneficiaryId: ${req.params.beneficiaryId}:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
};
export const updateMedicalRecord = async (req: Request, res: Response) => {
  try {
    const recordId = req.params.recordId as string;
    const data = await beneficiaryService.updateMedicalRecord(recordId, req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteMedicalRecord = async (req: Request, res: Response) => {
  try {
    const recordId = req.params.recordId as string;
    await beneficiaryService.deleteMedicalRecord(recordId);
    res.json({ success: true, message: 'Medical record deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
