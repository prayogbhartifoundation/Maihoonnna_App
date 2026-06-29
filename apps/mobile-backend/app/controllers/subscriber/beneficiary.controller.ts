import { Request, Response } from 'express';
import * as beneficiaryService from '../../services/subscriber/beneficiary_service';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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

export const uploadMedicalRecord = async (req: Request, res: Response) => {
  try {
    const subscriberId = (req as any).userId;
    const beneficiaryId = req.params.beneficiaryId as string;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Supabase configuration missing');
    }
    const supabase = createClient(url, key);
    const bucket = process.env.STORAGE_BUCKET || 'staff-documents';

    const ext = file.originalname.split('.').pop() || 'pdf';
    const path = `medical_records/${beneficiaryId}/${Date.now()}_${uuidv4().split('-')[0]}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const fileUrl = publicUrlData.publicUrl;

    const record = await beneficiaryService.createMedicalRecord(subscriberId, beneficiaryId, {
      title: req.body.title || file.originalname,
      fileUrl,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
    });

    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error uploading medical record:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
