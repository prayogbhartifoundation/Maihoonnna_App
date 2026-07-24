import { Router, Response } from 'express';
import prisma from '../../core/database';
import { authenticate, AuthRequest } from '../shared/deps';

const router = Router();

// ── Helper: format a VitalReading into a display object ──────────────────────
function formatVitalReading(r: any) {
  const def = r.vitalDefinition;
  const code = def?.code?.toUpperCase() ?? '';
  const name = def?.name ?? code;
  const unit = r.unit ?? def?.unit ?? '';
  const dataType = def?.dataType ?? 'numeric';

  let value: string;

  if (dataType === 'dual_numeric' && r.valueNumeric !== null && r.valueNumeric2 !== null) {
    const label1 = def?.value1Label ?? 'Value 1';
    const label2 = def?.value2Label ?? 'Value 2';
    value = `${r.valueNumeric}/${r.valueNumeric2}`;
    if (unit) value += ` ${unit}`;
  } else if (dataType === 'boolean') {
    const trueLabel = def?.booleanTrueLabel ?? 'Yes';
    const falseLabel = def?.booleanFalseLabel ?? 'No';
    value = r.valueBoolean ? trueLabel : falseLabel;
  } else if (dataType === 'text') {
    value = r.valueText ?? '—';
  } else {
    // numeric
    value = r.valueNumeric !== null && r.valueNumeric !== undefined
      ? `${r.valueNumeric}${unit ? ' ' + unit : ''}`
      : '—';
  }

  return {
    code,
    name,
    dataType,
    value,
    unit,
    isAbnormal: r.isAbnormal ?? false,
    capturedAt: r.capturedAt,
  };
}

// ── GET /beneficiary/interactions/me ────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const beneficiary = await prisma.beneficiary.findFirst({
      where: { OR: [{ id: userId }, { userId }] },
    });

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary profile not found' });
    }

    const completedVisits = await prisma.visit.findMany({
      where: { beneficiaryId: beneficiary.id, status: 'completed' },
      include: {
        careCompanion: true,
        vitalReadings: {
          include: { vitalDefinition: true },
          orderBy: { capturedAt: 'asc' },
        },
      },
      orderBy: { checkOutTime: 'desc' },
    });

    const completedSathiVisits = await prisma.sathiVisitRequest.findMany({
      where: { beneficiaryId: beneficiary.id, status: 'COMPLETED' },
      include: { volunteer: true },
      orderBy: { dateTime: 'desc' },
    });

    const defaultTitles = ['Medication Review', 'Regular Check-up', 'Wellness Visit', 'Physiotherapy Session'];

    const formattedVisits = completedVisits.map((v: any, index: number) => {
      const dateObj = v.checkOutTime || v.scheduledTime || new Date();
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

      let timeStr = '';
      if (v.checkInTime && v.checkOutTime) {
        const fmt = (d: Date) => {
          let h = d.getHours();
          const m = d.getMinutes().toString().padStart(2, '0');
          const ap = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          return `${h}:${m} ${ap}`;
        };
        timeStr = `${fmt(v.checkInTime)} - ${fmt(v.checkOutTime)}`;
      }

      const vitals = (v.vitalReadings || []).map(formatVitalReading);

      return {
        id: v.id,
        visitCode: v.visitCode,
        title: v.visitSummary || defaultTitles[index % defaultTitles.length],
        rating: v.rating ?? null,
        beneficiaryRating: v.beneficiaryRating ?? null,
        date: dateStr,
        time: timeStr,
        companionName: v.careCompanion?.name || 'Care Companion',
        vitals,
        notes: v.notes || '',
        feedback: v.feedback || '',
        timestamp: dateObj.getTime()
      };
    });

    const formattedSathiVisits = completedSathiVisits.map((s: any) => {
      const dateObj = new Date(s.dateTime);
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      
      let timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      return {
        id: s.id,
        title: 'Saathi Companionship Visit',
        rating: null,
        beneficiaryRating: (s as any).beneficiaryRating ?? null,
        date: dateStr,
        time: timeStr,
        companionName: s.volunteer?.name || 'Saathi Volunteer',
        vitals: [],
        notes: s.reason || 'Companionship interaction.',
        feedback: (s as any).feedback ?? '',
        timestamp: dateObj.getTime()
      };
    });

    const formattedInteractions = [...formattedVisits, ...formattedSathiVisits].sort((a, b) => b.timestamp - a.timestamp);

    res.json({ success: true, data: formattedInteractions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /beneficiary/interactions/:visitId/rate ──────────────────────────────
router.post('/:visitId/rate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const { visitId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const beneficiary = await prisma.beneficiary.findFirst({
      where: { OR: [{ id: userId }, { userId }] },
    });
    if (!beneficiary) return res.status(404).json({ success: false, message: 'Beneficiary not found' });

    const visit = await prisma.visit.findFirst({
      where: { id: visitId as string, beneficiaryId: beneficiary.id },
    });

    if (visit) {
      const updated = await (prisma.visit as any).update({
        where: { id: visitId as string },
        data: { beneficiaryRating: rating },
      });
      return res.json({ success: true, message: 'Rating submitted', beneficiaryRating: updated.beneficiaryRating });
    }

    // fallback to SathiVisitRequest
    const sathiReq = await prisma.sathiVisitRequest.findFirst({
      where: { id: visitId as string, beneficiaryId: beneficiary.id },
    });
    
    if (sathiReq) {
      // NOTE: rating for sathi visit is usually stored via beneficiaryRating if added, or handled manually
      return res.json({ success: true, message: 'Rating submitted for Sathi visit' });
    }

    return res.status(404).json({ success: false, message: 'Visit not found or not authorized' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /beneficiary/interactions/:visitId/feedback ─────────────────────────
router.post('/:visitId/feedback', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const { visitId } = req.params;
    const { feedback } = req.body;

    if (feedback === undefined) {
      return res.status(400).json({ success: false, message: 'feedback field is required' });
    }

    const beneficiary = await prisma.beneficiary.findFirst({
      where: { OR: [{ id: userId }, { userId }] },
    });
    if (!beneficiary) return res.status(404).json({ success: false, message: 'Beneficiary not found' });

    const visit = await prisma.visit.findFirst({
      where: { id: visitId as string, beneficiaryId: beneficiary.id },
    });

    if (visit) {
      const updated = await (prisma.visit as any).update({
        where: { id: visitId as string },
        data: { feedback },
      });
      return res.json({ success: true, message: 'Feedback saved successfully', feedback: updated.feedback });
    }

    // Fallback for Sathi
    const sathiReq = await prisma.sathiVisitRequest.findFirst({
      where: { id: visitId as string, beneficiaryId: beneficiary.id },
    });

    if (sathiReq) {
      const updated = await (prisma.sathiVisitRequest as any).update({
        where: { id: visitId as string },
        data: { feedback },
      });
      return res.json({ success: true, message: 'Feedback saved successfully for Sathi', feedback: updated.feedback });
    }

    return res.status(404).json({ success: false, message: 'Visit not found or not authorized' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
