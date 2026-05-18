import { Router, Request, Response } from 'express';
import prisma from '../../core/database';
import { authenticate, AuthRequest } from '../shared/deps';

const router = Router();

// Dashboard for Beneficiary (Secure me route)
router.get('/dashboard/me', authenticate, async (req: AuthRequest, res: Response) => {
    // We reuse the logic by passing req.userId
    req.params.beneficiaryId = req.userId!;
    return handleBeneficiaryDashboard(req, res);
});

// Dashboard for Beneficiary (Legacy route)
router.get('/dashboard/:beneficiaryId', authenticate, async (req: AuthRequest, res: Response) => {
    return handleBeneficiaryDashboard(req, res);
});

async function handleBeneficiaryDashboard(req: AuthRequest, res: Response) {
    try {
        const userId = req.params.beneficiaryId as string;

        const beneficiary = await prisma.beneficiary.findFirst({
            where: { userId: userId },
            include: {
                primaryCC: {
                    include: { user: true }
                },
            },
        });

        if (!beneficiary) {
            return res.status(404).json({ success: false, message: 'Beneficiary profile not found for this user' });
        }

        // Determine greeting based on time in IST (server time assumption or static for now)
        const currentHour = new Date().getHours();
        let greeting = 'Good Evening';
        if (currentHour < 12) greeting = 'Good Morning';
        else if (currentHour < 17) greeting = 'Good Afternoon';

        // Get next visit
        const nextVisit = await prisma.visit.findFirst({
            where: {
                beneficiaryId: beneficiary.id,
                scheduledTime: { gte: new Date() },
                status: 'scheduled',
            },
            orderBy: { scheduledTime: 'asc' },
        });

        // Calculate Adherence (Mock formula based on records, or just a static high number for demo if no records)
        const adherenceRecords = await prisma.medicationAdherence.findMany({
            where: { beneficiaryId: beneficiary.id },
        });

        let adherencePercentage = 95; // Default high for demo purporses
        if (adherenceRecords.length > 0) {
            const taken = adherenceRecords.filter(r => r.taken).length;
            adherencePercentage = Math.round((taken / adherenceRecords.length) * 100);
        }

        // Get today's medications
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const medications = await prisma.medication.findMany({
            where: {
                beneficiaryId: beneficiary.id,
                isActive: true,
            },
            include: {
                adherenceRecords: {
                    where: {
                        scheduledTime: { gte: today, lt: tomorrow }
                    }
                }
            }
        });

        // Format medications
        const todaysMedications = medications.map(med => {
            // Find if they took it today
            const takenToday = med.adherenceRecords.some(r => r.taken);
            return {
                id: med.id,
                name: med.name,
                dosage: med.dosage,
                condition: med.frequency, // We might not have a direct condition field on Medication model
                time: med.timeSlots[0] || '08:00 AM', // Take first timeslot or default
                completed: takenToday,
                adherenceScore: adherencePercentage // using overall adherence for individual as per design mockup
            }
        });

        // Get active subscription
        const activeSub = await prisma.subscription.findFirst({
            where: { beneficiaryId: beneficiary.id, isActive: true },
            include: { package: true }
        });

        res.json({
            success: true,
            data: {
                greeting,
                firstName: beneficiary.name.split(' ')[0], // Assuming first part of name
                emotionalScore: beneficiary.emotionalScore,
                nextVisit: nextVisit ? nextVisit.scheduledTime : null,
                adherence: `${adherencePercentage}%`,
                subscription: activeSub ? {
                    packageName: activeSub.package?.name,
                    hoursTotal: activeSub.hoursTotal,
                    hoursUsed: activeSub.hoursUsed,
                    remainingHours: Math.max(0, activeSub.hoursTotal - activeSub.hoursUsed)
                } : null,
                careCoordinator: (beneficiary.primaryCC && (beneficiary.primaryCC as any).user?.isActive !== false) ? {
                    id: beneficiary.primaryCC.id,
                    name: beneficiary.primaryCC.name,
                    role: 'Primary Care Coordinator',
                    bio: beneficiary.primaryCC.bio || 'Experienced care companion.',
                    photo: beneficiary.primaryCC.photo,
                    phone: (beneficiary.primaryCC as any).user?.phone || null
                } : null,
                todaysMedications
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Fetch Care Team
router.get('/:userId/team', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.params.userId as string;

        const beneficiary = await prisma.beneficiary.findFirst({
            where: { userId: userId },
            include: {
                primaryCC: { include: { user: true } },
                secondaryCC: { include: { user: true } },
                fieldManager: {
                    include: {
                        fieldManagerProfile: true
                    }
                }, 
            },
        });

        if (!beneficiary) {
            return res.status(404).json({ success: false, message: 'Beneficiary profile not found' });
        }

        const team = [];

        if (beneficiary.primaryCC && (beneficiary.primaryCC as any).user?.isActive !== false) {
            team.push({
                id: beneficiary.primaryCC.id,
                level: 'Primary',
                name: beneficiary.primaryCC.name,
                role: 'Primary Care Coordinator',
                bio: beneficiary.primaryCC.bio || 'Board-certified nurse practitioner with years of experience in geriatric care. Specialized in chronic disease management and patient education.',
                photo: beneficiary.primaryCC.photo,
                phone: (beneficiary.primaryCC as any).user?.phone || null
            });
        }

        if (beneficiary.secondaryCC && (beneficiary.secondaryCC as any).user?.isActive !== false) {
            team.push({
                id: beneficiary.secondaryCC.id,
                level: 'Secondary',
                name: beneficiary.secondaryCC.name,
                role: 'Secondary Care Coordinator',
                bio: beneficiary.secondaryCC.bio || 'Registered nurse with expertise in home healthcare coordination. Passionate about improving quality of life for seniors.',
                photo: beneficiary.secondaryCC.photo,
                phone: (beneficiary.secondaryCC as any).user?.phone || null
            });
        }

        if (beneficiary.fieldManager && beneficiary.fieldManager.isActive !== false) {
            const fmProfile = (beneficiary.fieldManager as any).fieldManagerProfile;
            const qualification = fmProfile?.qualification || 'Healthcare Operations Manager';
            const experience = fmProfile?.experience || 5;
            team.push({
                id: beneficiary.fieldManager.id,
                level: 'Field Manager',
                name: fmProfile?.name || beneficiary.fieldManager.name || 'Field Manager',
                role: 'Field Manager',
                bio: `${qualification}. Experienced operations manager with ${experience} years of expertise in overseeing local care teams, healthcare logistics, and emergency escalations.`,
                photo: fmProfile?.photo || null, 
                phone: fmProfile?.phone || beneficiary.fieldManager.phone || null
            });
        }

        res.json({ success: true, data: team });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Log a call
router.post('/log-call', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { callerId, receiverId } = req.body;

        if (!callerId || !receiverId) {
            return res.status(400).json({ success: false, message: 'callerId and receiverId are required' });
        }

        const log = await prisma.callLog.create({
            data: {
                callerId,
                receiverId
            }
        });

        res.json({ success: true, data: log });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Fetch Scheduled/Upcoming and Past Visits
router.get('/:userId/visits', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.params.userId as string;

        const beneficiary = await prisma.beneficiary.findFirst({
            where: { userId: userId },
        });

        if (!beneficiary) {
            return res.status(404).json({ success: false, message: 'Beneficiary profile not found' });
        }

        const visits = await prisma.visit.findMany({
            where: {
                beneficiaryId: beneficiary.id,
            },
            include: {
                careCompanion: true,
            },
            orderBy: {
                scheduledTime: 'desc',
            },
        });

        const upcomingRaw = visits.filter(v => v.status === 'scheduled').reverse();
        const pastRaw = visits.filter(v => v.status !== 'scheduled');

        const formatVisit = (v: any, isUpcoming: boolean) => {
            const dateObj = new Date(v.scheduledTime);
            
            // Format time (e.g. 11:00 AM)
            let hours = dateObj.getHours();
            const minutes = dateObj.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const formattedTime = `${hours}:${minutes} ${ampm}`;

            // Format date for upcoming (e.g. "Thursday, February 26")
            const optionsUpcoming: Intl.DateTimeFormatOptions = { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
            };
            const formattedDateUpcoming = dateObj.toLocaleDateString('en-US', optionsUpcoming);

            // Format date for past (e.g. "Feb 10")
            const optionsPast: Intl.DateTimeFormatOptions = { 
                month: 'short', 
                day: 'numeric' 
            };
            const formattedDatePast = dateObj.toLocaleDateString('en-US', optionsPast);

            // Compute duration hours text
            const durationMin = v.durationMinutes || 120;
            const durationHours = durationMin / 60;
            const durationText = `${durationHours} hour${durationHours !== 1 ? 's' : ''}`;

            // Alternate default titles based on index or database note
            const defaultTitles = ['Regular Check-up', 'Health Assessment', 'Medication Review', 'Wellness Visit'];
            const titleIndex = v.id ? (v.id.charCodeAt(0) % defaultTitles.length) : 0;
            const title = v.notes || defaultTitles[titleIndex];

            return {
                id: v.id,
                title,
                date: isUpcoming ? formattedDateUpcoming : formattedDatePast,
                time: formattedTime,
                duration: durationText,
                companionName: v.careCompanion?.name || 'Care Companion',
                type: 'Home Visit',
                status: v.status,
            };
        };

        const upcoming = upcomingRaw.map(v => formatVisit(v, true));
        const past = pastRaw.map(v => formatVisit(v, false));

        res.json({ 
            success: true, 
            data: { upcoming, past } 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Sub-routes modularization for scalability
import interactionsRouter from './interactions.routes';
import medicalRecordsRouter from './medical-records.routes';
import profileRouter from './profile.routes';

router.use('/interactions', interactionsRouter);
router.use('/medical-records', medicalRecordsRouter);
router.use('/profile', profileRouter);

export default router;
