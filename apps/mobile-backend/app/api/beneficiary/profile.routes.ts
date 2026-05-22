import { Router, Response } from 'express';
import prisma from '../../core/database';
import { authenticate, AuthRequest } from '../shared/deps';

const router = Router();

// Fetch beneficiary profile information
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const beneficiary = await prisma.beneficiary.findFirst({
            where: {
                OR: [
                    { id: userId },
                    { userId: userId }
                ]
            },
            include: {
                user: true,
                conditions: {
                    include: {
                        condition: true
                    }
                },
                emergencyContacts: true
            }
        });

        if (!beneficiary) {
            return res.status(404).json({ success: false, message: 'Beneficiary profile not found' });
        }

        res.json({ success: true, data: beneficiary });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update profile contact information
router.post('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { name, phone, email, address, age, gender } = req.body;

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

        // Update User account if details provided
        if (phone || email || name) {
            await prisma.user.update({
                where: { id: beneficiary.userId },
                data: {
                    ...(phone && { phone }),
                    ...(email && { email }),
                    ...(name && { name })
                }
            });
        }

        // Update Beneficiary table
        const updatedBeneficiary = await prisma.beneficiary.update({
            where: { id: beneficiary.id },
            data: {
                ...(name && { name }),
                ...(address && { address }),
                ...(age && { age: parseInt(age, 10) }),
                ...(gender && { gender })
            }
        });

        res.json({ success: true, data: updatedBeneficiary });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update Health Information (Blood group, allergies, conditions)
router.post('/health-info', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { bloodGroup, allergies, conditions } = req.body;

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

        // Update bloodGroup and allergies arrays
        await prisma.beneficiary.update({
            where: { id: beneficiary.id },
            data: {
                ...(bloodGroup && { bloodGroup }),
                ...(allergies && { allergies })
            }
        });

        // Sync conditions if provided
        // NOTE: Chronic Conditions represent the core "Medical Information" entity for the Beneficiary.
        // They are linked via the BeneficiaryCondition junction table to the MedicalCondition catalog.
        if (conditions && Array.isArray(conditions)) {
            // Delete existing relations
            await prisma.beneficiaryCondition.deleteMany({
                where: { beneficiaryId: beneficiary.id }
            });

            // Create new relations
            for (const condName of conditions) {
                // Find or create medical condition dynamically so that it works seamlessly without failing!
                let medCondition = await prisma.medicalCondition.findFirst({
                    where: { name: { equals: condName, mode: 'insensitive' } }
                });

                if (!medCondition) {
                    const slug = condName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    medCondition = await prisma.medicalCondition.create({
                        data: {
                            name: condName,
                            slug: `${slug}-${Date.now()}`,
                            category: 'chronic',
                            description: `Chronic condition: ${condName}`
                        }
                    });
                }

                await prisma.beneficiaryCondition.create({
                    data: {
                        beneficiaryId: beneficiary.id,
                        conditionId: medCondition.id,
                        severity: 'moderate',
                        isActive: true
                    }
                }).catch(e => console.error("Error creating beneficiary condition link:", e));
            }
        }

        res.json({ success: true, message: 'Health information updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Sync/Save emergency contacts
router.post('/emergency-contacts', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { contacts } = req.body;

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

        if (contacts && Array.isArray(contacts)) {
            // Remove existing emergency contacts
            await prisma.emergencyContact.deleteMany({
                where: { beneficiaryId: beneficiary.id }
            });

            // Insert new ones
            for (const c of contacts) {
                await prisma.emergencyContact.create({
                    data: {
                        beneficiaryId: beneficiary.id,
                        name: c.name,
                        phone: c.phone,
                        email: c.email || null,
                        relationship: c.relationship,
                        isPrimary: !!c.isPrimary,
                        notifyOnEmergency: true
                    }
                });
            }
        }

        res.json({ success: true, message: 'Emergency contacts synced successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
