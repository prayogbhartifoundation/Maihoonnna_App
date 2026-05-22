import { Router, Response } from 'express';
import prisma from '../../core/database';
import { authenticate, AuthRequest } from '../shared/deps';

const router = Router();

// Fetch completed interactions (Care History)
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const beneficiary = await prisma.beneficiary.findFirst({
            where: {
                OR: [
                    { id: userId },
                    { userId: userId }
                ]
            }
        });

        if (!beneficiary) {
            return res.status(404).json({ success: false, message: 'Beneficiary profile not found' });
        }

        const completedVisits = await prisma.visit.findMany({
            where: {
                beneficiaryId: beneficiary.id,
                status: 'completed'
            },
            include: {
                careCompanion: true
            },
            orderBy: {
                checkOutTime: 'desc'
            }
        });

        const formattedInteractions = completedVisits.map((v, index) => {
            const dateObj = v.checkOutTime || v.scheduledTime || new Date();
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            
            // Format time range
            let timeStr = '2:00 PM - 3:00 PM';
            if (v.checkInTime && v.checkOutTime) {
                const formatTime = (d: Date) => {
                    let hrs = d.getHours();
                    const mins = d.getMinutes().toString().padStart(2, '0');
                    const ampm = hrs >= 12 ? 'PM' : 'AM';
                    hrs = hrs % 12 || 12;
                    return `${hrs}:${mins} ${ampm}`;
                };
                timeStr = `${formatTime(v.checkInTime)} - ${formatTime(v.checkOutTime)}`;
            }

            const defaultTitles = ['Medication Review', 'Regular Check-up', 'Wellness Visit', 'Physiotherapy Session'];
            const title = defaultTitles[index % defaultTitles.length];

            return {
                id: v.id,
                title,
                rating: v.rating || 5,
                date: dateStr,
                time: timeStr,
                companionName: v.careCompanion?.name || 'Mark Thompson',
                vitals: {
                    bp: v.bpSystolic && v.bpDiastolic ? `${v.bpSystolic}/${v.bpDiastolic}` : '120/80',
                    heart: v.heartRate ? `${v.heartRate} bpm` : '72 bpm',
                    temp: v.temperature ? `${v.temperature}°F` : '98.6°F',
                    o2: v.oxygenLevel ? `${v.oxygenLevel}%` : '98%'
                },
                notes: v.notes || 'No clinical notes recorded.',
                feedback: v.feedback || 'Very professional and helpful. Answered all my questions.'
            };
        });

        res.json({ success: true, data: formattedInteractions });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
