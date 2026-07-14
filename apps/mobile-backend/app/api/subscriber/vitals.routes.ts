import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../shared/deps';
import prisma from '../../core/database';

const router = Router();

// GET /subscriber/vitals/trends/:beneficiaryId
router.get('/trends/:beneficiaryId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const beneficiaryId = req.params.beneficiaryId as string;
    let days = parseInt(req.query.days as string) || 30;
    if (days <= 0 || days > 365) days = 30;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);


    // Make sure the subscriber has access to this beneficiary
    const beneficiary = await prisma.beneficiary.findFirst({
      where: {
        id: beneficiaryId,
        subscriberId: req.userId as string
      }
    });

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found or unauthorized' });
    }

    // Get readings for this period — both CC and self-reported
    const readings = await prisma.vitalReading.findMany({
      where: {
        beneficiaryId: beneficiaryId as string,
        capturedAt: { gte: fromDate }
      },
      include: {
        vitalDefinition: {
          select: { code: true, name: true, unit: true, dataType: true, normalMax: true, normalMin: true, normalMax2: true, normalMin2: true }
        },
        capturedBy: { select: { name: true } }
      },
      orderBy: { capturedAt: 'asc' }
    }) as any[];

    // Group by vitalDefinition.code
    const grouped = new Map<string, any>();

    for (const r of readings) {
      const def = r.vitalDefinition;
      if (!def) continue;
      const code = def.code.toUpperCase();

      if (!grouped.has(code)) {
        grouped.set(code, {
          name: def.name,
          code: code,
          unit: r.unit || def.unit || '',
          dataType: def.dataType,
          gridMax: def.normalMax ? Math.ceil(def.normalMax * 1.5) : 200,
          v1: [],
          v2: [] // for dual_numeric
        });
      }

      const group = grouped.get(code);
      const dateStr = r.capturedAt.toISOString().split('T')[0]; // simple YYYY-MM-DD
      const shortDate = r.capturedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const src = r.source || 'care_companion';
      const recName = src === 'beneficiary'
        ? 'Self'
        : (r.capturedBy
            ? r.capturedBy.name || 'Care Companion'
            : 'Care Companion');

      if (def.dataType === 'numeric' || def.dataType === 'dual_numeric') {
        if (r.valueNumeric !== null) {
          group.v1.push({ date: shortDate, fullDate: dateStr, value: r.valueNumeric, source: src, recorder: recName });
        }
        if (def.dataType === 'dual_numeric' && r.valueNumeric2 !== null) {
          group.v2.push({ date: shortDate, fullDate: dateStr, value: r.valueNumeric2, source: src, recorder: recName });
        }
      }
    }

    // Convert map to array and keep last N points (e.g., 7) per vital for clean mobile charts
    const trends = Array.from(grouped.values()).map(g => {
      // slice to keep last 7 data points max
      g.v1 = g.v1.slice(-7);
      if (g.v2) g.v2 = g.v2.slice(-7);
      
      // dynamically set gridMax based on max value present or default
      let maxVal = 0;
      g.v1.forEach((pt: any) => { if (pt.value > maxVal) maxVal = pt.value; });
      if (g.v2) g.v2.forEach((pt: any) => { if (pt.value > maxVal) maxVal = pt.value; });
      
      // Calculate a sensible grid maximum
      if (maxVal > 0) {
        g.gridMax = Math.ceil(maxVal * 1.2);
      } else {
        g.gridMax = g.gridMax || 200;
      }
      
      // Generate grid values for Y-axis (e.g. [0, 50, 100, 150, 200])
      g.gridValues = [];
      const step = Math.ceil(g.gridMax / 4);
      for (let i = 0; i <= 4; i++) {
        g.gridValues.push(i * step);
      }
      g.gridMax = g.gridValues[4];

      // Assign colors based on typical conventions
      const code = g.code;
      if (code === 'BP' || code === 'BLOOD_PRESSURE') g.color = '#EF4444'; // red
      else if (code === 'PULSE' || code === 'HEART_RATE') g.color = '#F43F5E'; // rose
      else if (code === 'SPO2' || code === 'OXYGEN_LEVEL') g.color = '#3B82F6'; // blue
      else if (code === 'TEMP' || code === 'TEMPERATURE') g.color = '#F59E0B'; // amber
      else if (code === 'WEIGHT') g.color = '#10B981'; // green
      else if (code === 'BLOOD_GLUCOSE') g.color = '#8B5CF6'; // purple
      else g.color = '#6366F1'; // indigo default

      return g;
    });

    res.json({ success: true, data: trends });
  } catch (error: any) {
    console.error('GET /subscriber/vitals/trends error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
