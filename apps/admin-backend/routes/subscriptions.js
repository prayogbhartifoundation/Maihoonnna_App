const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// ── GET /api/subscriptions/:id/balances ──────────────────────────────────────
// Fetch all benefit balances for a specific subscription
router.get('/:id/balances', async (req, res) => {
    try {
        const balances = await prisma.subscriptionBenefitBalance.findMany({
            where: { subscriptionId: req.params.id },
            include: { benefit: true }
        });
        res.json({ success: true, data: balances });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /api/subscriptions/enroll ───────────────────────────────────────────
// Enroll a beneficiary in a package and initialize balances
router.post('/enroll', async (req, res) => {
    const { subscriberId, beneficiaryId, packageId, duration = 'monthly', startDate = new Date() } = req.body;

    if (!subscriberId || !beneficiaryId || !packageId) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        // 1. Fetch package and its benefits
        const pkg = await prisma.subscriptionPackage.findUnique({
            where: { id: packageId },
            include: { packageBenefits: true }
        });

        if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

        // 2. Set dates
        const start = new Date(startDate);
        const end = new Date(start);
        if (duration === 'six_months') end.setMonth(end.getMonth() + 6);
        else if (duration === 'annual') end.setFullYear(end.getFullYear() + 1);
        else end.setMonth(end.getMonth() + 1);

        // 3. Create subscription and balances in a transaction
        const subscription = await prisma.$transaction(async (tx) => {
            // Deactivate existing active subscriptions for this beneficiary
            await tx.subscription.updateMany({
                where: { beneficiaryId, isActive: true },
                data: { isActive: false }
            });

            const sub = await tx.subscription.create({
                data: {
                    subscriberId,
                    beneficiaryId,
                    packageType: pkg.type,
                    duration,
                    startDate: start,
                    endDate: end,
                    visitsTotal: pkg.visitsPerWeek * 4, // Simple approximation
                    hoursTotal: pkg.totalHours,
                    isActive: true
                }
            });

            // Initialize benefit balances
            if (pkg.packageBenefits.length > 0) {
                await tx.subscriptionBenefitBalance.createMany({
                    data: pkg.packageBenefits.map(pb => ({
                        subscriptionId: sub.id,
                        benefitId: pb.benefitId,
                        totalUnits: pb.unitsIncluded,
                        usedUnits: 0
                    }))
                });
            }

            return sub;
        });

        res.status(201).json({ success: true, data: subscription });
    } catch (err) {
        console.error('Enrollment error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /api/subscriptions/:id/consume ─────────────────────────────────────
// Deduct units from a benefit balance
router.post('/:id/consume', async (req, res) => {
    const { benefitId, units = 1, notes } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const balance = await tx.subscriptionBenefitBalance.findUnique({
                where: { subscriptionId_benefitId: { subscriptionId: req.params.id, benefitId } }
            });

            if (!balance) throw new Error('No balance found for this benefit in subscription');
            if (balance.totalUnits < balance.usedUnits + units) {
                throw new Error('Insufficient balance for this benefit');
            }

            return tx.subscriptionBenefitBalance.update({
                where: { id: balance.id },
                data: { usedUnits: { increment: units } }
            });
        });

        res.json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;
