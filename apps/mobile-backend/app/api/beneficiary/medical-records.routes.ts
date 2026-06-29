import { Router, Response } from 'express';
import prisma from '../../core/database';
import { authenticate, AuthRequest } from '../shared/deps';

const router = Router();

// ── Fallback icon/color for vital codes that have no iconCode stored in DB ───
// This is only a UI fallback — vitals themselves are 100% driven by the DB.
const FALLBACK_COLOR_BY_CODE: Record<string, string> = {
    BP: '#8B5CF6', BLOOD_PRESSURE: '#8B5CF6',
    PULSE: '#EF4444', HEART_RATE: '#EF4444',
    SPO2: '#10B981', OXYGEN_LEVEL: '#10B981',
    TEMP: '#06B6D4', TEMPERATURE: '#06B6D4',
    WEIGHT: '#3B82F6',
    BLOOD_GLUCOSE: '#F59E0B',
};
const DEFAULT_COLOR = '#6B7280';
const DEFAULT_ICON = 'clipboard-pulse';

// GET /beneficiary/medical-records/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;

        const beneficiary = await prisma.beneficiary.findFirst({
            where: { OR: [{ id: userId }, { userId }] },
            include: {
                vitalConfigs: {
                    where: { isActive: true },
                    include: {
                        vitalDefinition: {
                            select: {
                                id: true, code: true, name: true, unit: true,
                                dataType: true, iconCode: true, displayOrder: true,
                                normalMin: true, normalMax: true,
                                normalMin2: true, normalMax2: true,
                                value1Label: true, value2Label: true,
                                booleanTrueLabel: true, booleanFalseLabel: true,
                            }
                        }
                    }
                }
            }
        });

        if (!beneficiary) {
            return res.status(404).json({ success: false, message: 'Beneficiary profile not found' });
        }

        // ── 1. Latest reading per vital ──────────────────────────────────────
        const allReadings = await prisma.vitalReading.findMany({
            where: { beneficiaryId: beneficiary.id },
            include: {
                vitalDefinition: {
                    select: { code: true, name: true, unit: true, dataType: true, iconCode: true, displayOrder: true }
                }
            },
            orderBy: { capturedAt: 'desc' }
        });

        // Build "latest by code" map
        const latestByCode: Record<string, { v1: number | null; v2: number | null; text: string | null; bool: boolean | null }> = {};
        for (const r of allReadings) {
            const code = r.vitalDefinition?.code?.toUpperCase();
            if (code && !latestByCode[code]) {
                latestByCode[code] = {
                    v1: r.valueNumeric,
                    v2: r.valueNumeric2,
                    text: r.valueText,
                    bool: r.valueBoolean,
                };
            }
        }

        // ── 2. Build latestReadings from active vitalConfigs ─────────────────
        const activeConfigs = [...(beneficiary.vitalConfigs || [])];
        activeConfigs.sort((a, b) =>
            (a.vitalDefinition?.displayOrder ?? 99) - (b.vitalDefinition?.displayOrder ?? 99)
        );

        const seenCodes = new Set<string>();
        const latestReadings: any[] = [];

        for (const config of activeConfigs) {
            const def = config.vitalDefinition;
            if (!def || seenCodes.has(def.code)) continue;
            seenCodes.add(def.code);

            const code = def.code.toUpperCase();
            const reading = latestByCode[code];

            let displayValue = '--';
            if (reading) {
                if (def.dataType === 'dual_numeric' && reading.v1 != null && reading.v2 != null) {
                    displayValue = `${reading.v1}/${reading.v2}${def.unit ? ' ' + def.unit : ''}`;
                } else if (def.dataType === 'boolean' && reading.bool != null) {
                    displayValue = reading.bool ? (def.booleanTrueLabel ?? 'Yes') : (def.booleanFalseLabel ?? 'No');
                } else if (def.dataType === 'text' && reading.text) {
                    displayValue = reading.text;
                } else if (reading.v1 != null) {
                    displayValue = `${reading.v1}${def.unit ? ' ' + def.unit : ''}`;
                }
            }

            latestReadings.push({
                code,
                name: def.name,
                icon: def.iconCode || DEFAULT_ICON,
                color: FALLBACK_COLOR_BY_CODE[code] || DEFAULT_COLOR,
                value: displayValue,
                unit: def.unit || '',
                dataType: def.dataType,
                hasReading: !!reading,
            });
        }

        // If no vitalConfigs, fall back to whatever codes have readings
        if (activeConfigs.length === 0) {
            for (const r of allReadings) {
                const def = r.vitalDefinition;
                if (!def) continue;
                const code = def.code.toUpperCase();
                if (seenCodes.has(code)) continue;
                seenCodes.add(code);

                const reading = latestByCode[code];
                let displayValue = '--';
                if (reading?.v1 != null && reading.v2 != null) displayValue = `${reading.v1}/${reading.v2}`;
                else if (reading?.v1 != null) displayValue = `${reading.v1}${def.unit ? ' ' + def.unit : ''}`;
                else if (reading?.text) displayValue = reading.text;

                latestReadings.push({
                    code,
                    name: def.name,
                    icon: def.iconCode || DEFAULT_ICON,
                    color: FALLBACK_COLOR_BY_CODE[code] || DEFAULT_COLOR,
                    value: displayValue,
                    unit: def.unit || '',
                    dataType: def.dataType,
                    hasReading: !!reading,
                });
            }
        }

        // ── 3. Trends (last 30 days, grouped by vital code) ──────────────────
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);

        const recentReadings = allReadings
            .filter(r => new Date(r.capturedAt) >= fromDate)
            .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());

        const grouped = new Map<string, any>();
        for (const r of recentReadings) {
            const def = r.vitalDefinition;
            if (!def || (def.dataType !== 'numeric' && def.dataType !== 'dual_numeric')) continue;

            const code = def.code.toUpperCase();
            if (!grouped.has(code)) {
                grouped.set(code, {
                    name: def.name,
                    code,
                    unit: def.unit || '',
                    dataType: def.dataType,
                    icon: def.iconCode || DEFAULT_ICON,
                    color: FALLBACK_COLOR_BY_CODE[code] || '#6366F1',
                    gridMax: 200,
                    v1: [],
                    v2: [],
                });
            }
            const g = grouped.get(code);
            const shortDate = new Date(r.capturedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const fullDate = new Date(r.capturedAt).toISOString().split('T')[0];

            if (r.valueNumeric != null) g.v1.push({ date: shortDate, fullDate, value: r.valueNumeric });
            if (def.dataType === 'dual_numeric' && r.valueNumeric2 != null) g.v2.push({ date: shortDate, fullDate, value: r.valueNumeric2 });
        }

        const trends = Array.from(grouped.values()).map(g => {
            g.v1 = g.v1.slice(-7);
            g.v2 = g.v2.slice(-7);

            let maxVal = 0;
            [...g.v1, ...g.v2].forEach((pt: any) => { if (pt.value > maxVal) maxVal = pt.value; });
            g.gridMax = maxVal > 0 ? Math.ceil(maxVal * 1.2) : 200;

            const step = Math.ceil(g.gridMax / 4);
            g.gridValues = [0, step, step * 2, step * 3, step * 4];
            g.gridMax = g.gridValues[4];

            return g;
        });

        // ── 4. History: per-visit vitals grouped ─────────────────────────────
        const completedVisits = await prisma.visit.findMany({
            where: { beneficiaryId: beneficiary.id, status: 'completed' },
            include: {
                vitalReadings: {
                    include: {
                        vitalDefinition: {
                            select: { name: true, unit: true, dataType: true, iconCode: true }
                        }
                    }
                }
            },
            orderBy: { checkOutTime: 'desc' },
            take: 20,
        });

        const history = completedVisits
            .map(v => {
                const dateObj = v.checkOutTime || v.scheduledTime || new Date();
                const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                // Build an array of { name, value, icon } for all vitals in this visit
                const vitals = v.vitalReadings.map(r => {
                    const def = r.vitalDefinition;
                    if (!def) return null;

                    let value = '--';
                    if (r.valueNumeric != null && r.valueNumeric2 != null) {
                        value = `${r.valueNumeric}/${r.valueNumeric2}${def.unit ? ' ' + def.unit : ''}`;
                    } else if (r.valueNumeric != null) {
                        value = `${r.valueNumeric}${def.unit ? ' ' + def.unit : ''}`;
                    } else if (r.valueText) {
                        value = r.valueText;
                    } else if (r.valueBoolean != null) {
                        value = r.valueBoolean ? 'Yes' : 'No';
                    }

                    return {
                        name: def.name,
                        value: value.trim(),
                        icon: def.iconCode || DEFAULT_ICON,
                    };
                }).filter(Boolean);

                return { id: v.id, date, vitals };
            })
            .filter(h => h.vitals.length > 0);

        res.json({
            success: true,
            data: { latestReadings, trends, history }
        });
    } catch (error: any) {
        console.error('Beneficiary medical records error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
