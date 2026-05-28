import { Router, Request, Response } from 'express';
import { authenticate, validate } from '../shared/deps';
import { createVisitSchema, checkInSchema, checkOutSchema, rateVisitSchema } from '../../schemas/visit';
import * as visitService from '../../services/care_companion/visit_service';
import prisma from '../../core/database';

const router = Router();

router.post('/', authenticate, validate(createVisitSchema), async (req: Request, res: Response) => {
  const visit = await visitService.createVisit(req.body);
  res.status(201).json({ success: true, data: visit });
});

router.get('/beneficiary/:beneficiaryId', authenticate, async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const visits = await visitService.getBeneficiaryVisits(req.params.beneficiaryId as string, limit);
  res.json({ success: true, data: visits });
});

router.get('/care_companion/:ccId', authenticate, async (req: Request, res: Response) => {
  const visits = await visitService.getCareCompanionVisits(req.params.ccId as string, req.query.date as string);
  res.json({ success: true, data: visits });
});

router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { careCompanionProfile: true }
    });

    if (!user || !user.careCompanionProfile) {
      return res.status(404).json({ success: false, message: 'Care Companion profile not found' });
    }

    const ccId = user.careCompanionProfile.id;

    const completedVisits = await prisma.visit.findMany({
      where: {
        careCompanionId: ccId,
        status: 'completed',
      },
      include: {
        beneficiary: true,
        medicationAdherenceRecords: {
          include: {
            medication: true
          }
        }
      },
      orderBy: {
        checkOutTime: 'desc',
      },
    });

    const totalVisitsCount = completedVisits.length;
    const totalMinutes = completedVisits.reduce((sum, v) => sum + (v.durationMinutes || 0), 0);
    const totalHoursVal = totalMinutes / 60;
    const avgHoursVal = totalVisitsCount > 0 ? (totalHoursVal / totalVisitsCount) : 0;

    const stats = {
      totalVisits: totalVisitsCount.toString(),
      totalHours: totalHoursVal.toFixed(1),
      avgHours: avgHoursVal.toFixed(1),
    };

    const visits = completedVisits.map((v) => {
      const addressParts = [];
      if (v.beneficiary.flatPlot) addressParts.push(v.beneficiary.flatPlot);
      if (v.beneficiary.streetArea) addressParts.push(v.beneficiary.streetArea);
      if (v.beneficiary.city) addressParts.push(v.beneficiary.city);
      const patientAddress = addressParts.join(', ') || 'N/A';

      const dateObj = v.checkOutTime || v.scheduledTime || new Date();
      const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;

      const bp = v.bpSystolic && v.bpDiastolic ? `${v.bpSystolic}/${v.bpDiastolic}` : 'N/A';
      const weight = v.weight ? `${v.weight} kg` : 'N/A';
      const temp = v.temperature ? `${v.temperature}°C` : 'N/A';
      const o2 = v.oxygenLevel ? `${v.oxygenLevel}%` : 'N/A';

      const meds = v.medicationAdherenceRecords
        .filter(m => m.taken)
        .map(m => {
          const suffix = m.medication.dosage ? ` ${m.medication.dosage}` : '';
          return `${m.medication.name}${suffix}`;
        });

      return {
        id: v.id,
        patientName: v.beneficiary.name,
        address: patientAddress,
        date: dateStr,
        duration: `${v.durationMinutes || 0} mins`,
        tags: ['Home Visit', v.medicationAdherence ? 'Meds Taken' : 'Meds Flagged'],
        isExpanded: false,
        details: {
          vitals: { bp, weight, temp, o2 },
          meds,
          mood: v.mood || 'N/A',
          notes: v.notes || 'No visit notes captured.',
        }
      };
    });

    res.json({
      success: true,
      data: {
        stats,
        visits,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/check-in', authenticate, validate(checkInSchema), async (req: Request, res: Response) => {
  try {
    const visit = await visitService.checkIn(req.body);
    res.json({
      success: true,
      data: {
        id: visit.id,
        status: visit.status,
        checkInTime: visit.checkInTime,
        isGeoVerified: visit.isGeoVerified,
        geoDistanceMeters: visit.geoDistanceMeters,
        manualCheckInReason: visit.manualCheckInReason,
      }
    });
  } catch (e: unknown) {
    res.status(404).json({ success: false, message: (e as Error).message });
  }
});

router.post('/check-out', authenticate, validate(checkOutSchema), async (req: Request, res: Response) => {
  try {
    const visit = await visitService.checkOut(req.body);
    res.json({ success: true, data: visit });
  } catch (e: unknown) {
    res.status(404).json({ success: false, message: (e as Error).message });
  }
});

router.post('/rate', authenticate, validate(rateVisitSchema), async (req: Request, res: Response) => {
  try {
    const visit = await visitService.rateVisit(req.body);
    res.json({ success: true, data: visit });
  } catch (e: unknown) {
    res.status(400).json({ success: false, message: (e as Error).message });
  }
});

router.get('/:visitId/details', authenticate, async (req: Request, res: Response) => {
  try {
    const visitId = req.params.visitId as string;
    
    // Fetch visit and beneficiary
    const visit: any = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        beneficiary: true,
      }
    });

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // Fetch dynamic vitals config for the beneficiary
    const configs = await prisma.beneficiaryVitalConfig.findMany({
      where: {
        beneficiaryId: visit.beneficiaryId,
        isActive: true,
      },
      include: {
        vitalDefinition: true,
      },
      orderBy: {
        vitalDefinition: {
          displayOrder: 'asc',
        }
      }
    });

    const requiredVitalsRaw = configs.map(c => {
      const def = c.vitalDefinition;
      return {
        id: def.id,
        code: def.code,
        name: def.name,
        description: def.description,
        unit: def.unit,
        dataType: def.dataType,
        value1Label: def.value1Label,
        value2Label: def.value2Label,
        textOptions: def.textOptions,
        booleanTrueLabel: def.booleanTrueLabel || 'Yes',
        booleanFalseLabel: def.booleanFalseLabel || 'No',
        isMandatory: c.isMandatory,
      };
    });

    const requiredVitals = requiredVitalsRaw.filter(v => {
      // 1. Remove legacy duplicate split-fields for Blood Pressure if dual_numeric BP is active
      if (v.code === 'BP_SYS' || v.code === 'BP_DIA' || v.code === 'BP_SYSTOLIC' || v.code === 'BP_DIASTOLIC') return false;

      return true;
    });

    // Fetch active medications for the beneficiary
    const medications = await prisma.medication.findMany({
      where: {
        beneficiaryId: visit.beneficiaryId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        dosage: true,
        frequency: true,
        instructions: true,
      }
    });

    res.json({
      success: true,
      data: {
        visit: {
          id: visit.id,
          encounterId: visit.encounterId,
          scheduledTime: visit.scheduledTime,
          checkInTime: visit.checkInTime,
          checkOutTime: visit.checkOutTime,
          status: visit.status,
          notes: visit.notes,
          manualCheckInReason: visit.manualCheckInReason,
          // Geo-fencing fields for the mobile app
          isGeoVerified: visit.isGeoVerified,
          geoDistanceMeters: visit.geoDistanceMeters,
        },
        beneficiary: {
          id: visit.beneficiary.id,
          name: visit.beneficiary.name,
          age: visit.beneficiary.age,
          gender: visit.beneficiary.gender || 'N/A',
          address: visit.beneficiary.address || 'N/A',
          flatPlot: visit.beneficiary.flatPlot,
          streetArea: visit.beneficiary.streetArea,
          city: visit.beneficiary.city,
          pincode: visit.beneficiary.pincode,
          photo: visit.beneficiary.photo || null,
          // GPS coordinates for client-side geo-fencing preview
          latitude: visit.beneficiary.latitude || null,
          longitude: visit.beneficiary.longitude || null,
        },
        requiredVitals,
        activeMedications: medications.map(m => ({
          id: m.id,
          name: `${m.name} ${m.dosage}`.trim(),
          frequency: m.frequency,
          instructions: m.instructions,
        })),
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;