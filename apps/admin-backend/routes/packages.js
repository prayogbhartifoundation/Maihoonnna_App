const express = require('express');
const router = express.Router();
const path = require('path');
const { prisma } = require('../lib/prisma');

function normalizeUnit(unitLabel) {
  if (!unitLabel) return 'visits';
  const clean = unitLabel.replace(/^per\s+/i, '').trim().toLowerCase();
  if (clean === 'visit') return 'visits';
  if (clean === 'hour') return 'hours';
  if (clean === 'session') return 'sessions';
  if (clean === 'test') return 'tests';
  if (clean.endsWith('s')) return clean;
  return clean + 's';
}

// GET /api/packages — list all with nested benefits
router.get('/', async (req, res) => {
  try {
    const packages = await prisma.subscriptionPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        packageBenefits: {
          orderBy: { displayOrder: 'asc' },
          include: {
            benefit: {
              include: {
                benefitType: { select: { name: true, iconCode: true } },
              },
            },
          },
        },
        packageDiscounts: { where: { isActive: true } },
      },
    });

    // Map fields for frontend compatibility
    const mappedPackages = packages.map((pkg) => ({
      ...pkg,
      totalCost: pkg.basePrice,
      benefits: (pkg.packageBenefits || []).map((pb) => ({
        ...pb,
        monthlyUnits: pb.unitsIncluded,
      })),
    }));

    res.json({ success: true, data: mappedPackages });
  } catch (err) {
    console.error('GET packages error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/packages/:id — single package
router.get('/:id', async (req, res) => {
  try {
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id: req.params.id },
      include: {
        packageBenefits: {
          orderBy: { displayOrder: 'asc' },
          include: {
            benefit: { include: { benefitType: { select: { name: true } } } },
          },
        },
        packageDiscounts: true,
      },
    });
    if (!pkg)
      return res
        .status(404)
        .json({ success: false, message: 'Package not found' });

    // Map fields for frontend compatibility
    const mappedPackage = {
      ...pkg,
      totalCost: pkg.basePrice,
      benefits: (pkg.packageBenefits || []).map((pb) => ({
        ...pb,
        monthlyUnits: pb.unitsIncluded,
      })),
    };

    res.json({ success: true, data: mappedPackage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/packages — create package + packageBenefits in a transaction
// Body: { name, description, packageCost, mrp, discountPercentage, billingCycle, activeFrom, activeTo, benefits: [{benefitId, unitsIncluded, unitsPeriod, isUnlimited}] }
router.post('/', async (req, res) => {
  const {
    name,
    description,
    packageCost,
    mrp,
    discountPercentage,
    miscellaneousCost,
    currency,
    billingCycle,
    isFreeTrial,
    trialDurationDays,
    activeFrom,
    activeTo,
    displayOrder,
    benefits = [],
    discounts = [],
    isGlobal,
    isPopular,
  } = req.body;

  if (!name || !activeFrom) {
    return res
      .status(400)
      .json({ success: false, message: 'name and activeFrom are required' });
  }

  try {
    const typeCode = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const pkg = await prisma.$transaction(async (tx) => {
      // 1. Create the package header
      const created = await tx.subscriptionPackage.create({
        data: {
          type: typeCode + '_' + Date.now(), // Append timestamp for uniqueness
          name,
          description: description || name,
          basePrice:
            packageCost ??
            (req.body.totalCost ? parseFloat(req.body.totalCost) : 0),
          mrp: mrp ? parseFloat(mrp) : 0,
          discountPercentage: discountPercentage
            ? parseFloat(discountPercentage)
            : 0,
          miscellaneousCost: miscellaneousCost
            ? parseFloat(miscellaneousCost)
            : 0,
          currency: currency ?? 'INR',
          billingCycle: billingCycle ?? 'monthly',
          isFreeTrial: isFreeTrial ?? false,
          trialDurationDays: trialDurationDays ?? null,
          activeFrom: new Date(activeFrom),
          activeTo: activeTo ? new Date(activeTo) : null,
          sortOrder: displayOrder ?? 0,
          isGlobal: isGlobal ?? true,
          isPopular: isPopular ?? false,
        },
      });

      // 2. Create packageBenefits
      if (benefits.length > 0) {
        const dbBenefits = await tx.benefit.findMany({
          where: { id: { in: benefits.map(b => b.benefitId) } }
        });
        const benefitMap = {};
        dbBenefits.forEach(b => {
          benefitMap[b.id] = normalizeUnit(b.unitLabel);
        });

        await tx.packageBenefit.createMany({
          data: benefits.map((b, idx) => ({
            packageId: created.id,
            benefitId: b.benefitId,
            unitsIncluded: b.unitsIncluded ?? b.monthlyUnits ?? 1,
            unitsPeriod: b.unitsPeriod ?? 'monthly',
            unit: benefitMap[b.benefitId] || 'visits',
            isUnlimited: b.isUnlimited ?? false,
            allowRollover: b.allowRollover ?? false,
            displayOrder: idx,
          })),
        });
      }

      // 3. Update legacy features array from confirmed DB state
      let visitsPerWeek = 0;
      let hoursPerMonth = 0;
      let features = [];
      const createdBenefits = await tx.packageBenefit.findMany({
        where: { packageId: created.id },
        include: { benefit: true }
      });
      createdBenefits.forEach(pb => {
        const units = pb.unitsIncluded;
        const label = pb.benefit?.unitLabel || 'visits';
        features.push(`${units} ${label.replace(/^per\s+/i, '')}`);
        if (label.toLowerCase().includes('visit')) visitsPerWeek += Math.round(units / 4);
        if (label.toLowerCase().includes('hour')) hoursPerMonth += units;
      });
      await tx.subscriptionPackage.update({
        where: { id: created.id },
        data: { features, visitsPerWeek, hoursPerMonth }
      });

      // 4. Create discounts
      if (discounts.length > 0) {
        await tx.packageDiscount.createMany({
          data: discounts.map((d) => ({
            packageId: created.id,
            billingCycle: d.billingCycle,
            discountType: d.discountType ?? 'percentage',
            discountValue: d.discountValue ?? 0,
            finalCost: d.finalCost ?? null,
          })),
        });
      }

      return tx.subscriptionPackage.findUnique({
        where: { id: created.id },
        include: {
          packageBenefits: { include: { benefit: true } },
          packageDiscounts: true,
        },
      });
    });

    res.status(201).json({ success: true, data: pkg });
  } catch (err) {
    console.error('POST packages error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/packages/:id — update package header
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    packageCost,
    mrp,
    discountPercentage,
    miscellaneousCost,
    billingCycle,
    isFreeTrial,
    trialDurationDays,
    activeFrom,
    activeTo,
    displayOrder,
    isActive,
    isGlobal,
    isPopular,
  } = req.body;
  try {
    const pkg = await prisma.subscriptionPackage.update({
      where: { id },
      data: {
        name,
        description,
        basePrice: packageCost ? parseFloat(packageCost) : undefined,
        mrp: mrp ? parseFloat(mrp) : undefined,
        discountPercentage: discountPercentage
          ? parseFloat(discountPercentage)
          : undefined,
        miscellaneousCost: miscellaneousCost
          ? parseFloat(miscellaneousCost)
          : undefined,
        billingCycle,
        isFreeTrial,
        trialDurationDays,
        activeFrom: activeFrom ? new Date(activeFrom) : undefined,
        activeTo: activeTo ? new Date(activeTo) : undefined,
        sortOrder: displayOrder,
        isActive,
        isGlobal,
        isPopular,
      },
    });
    res.json({ success: true, data: pkg });
  } catch (err) {
    if (err.code === 'P2025')
      return res
        .status(404)
        .json({ success: false, message: 'Package not found' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/packages/:id — full update (header + benefits + discounts)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    packageCost,
    mrp,
    discountPercentage,
    miscellaneousCost,
    currency,
    billingCycle,
    isFreeTrial,
    trialDurationDays,
    activeFrom,
    activeTo,
    displayOrder,
    benefits = [],
    discounts = [],
    isGlobal,
    isPopular,
    totalHours,
  } = req.body;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update the package header
      const pkg = await tx.subscriptionPackage.update({
        where: { id },
        data: {
          name,
          description: description || name,
          basePrice:
            packageCost ??
            (req.body.totalCost ? parseFloat(req.body.totalCost) : 0),
          mrp: mrp ? parseFloat(mrp) : 0,
          discountPercentage: discountPercentage
            ? parseFloat(discountPercentage)
            : 0,
          miscellaneousCost: miscellaneousCost
            ? parseFloat(miscellaneousCost)
            : 0,
          currency: currency ?? 'INR',
          billingCycle: billingCycle ?? 'monthly',
          isFreeTrial: isFreeTrial ?? false,
          trialDurationDays: trialDurationDays ?? null,
          activeFrom: activeFrom ? new Date(activeFrom) : undefined,
          activeTo: activeTo ? new Date(activeTo) : null,
          sortOrder: displayOrder ?? 0,
          isGlobal: isGlobal ?? true,
          isPopular: isPopular ?? false,
          totalHours: totalHours ? parseFloat(totalHours) : undefined,
        },
      });

      // 2. Refresh benefits (delete and recreate)
      if (benefits.length > 0) {
        await tx.packageBenefit.deleteMany({ where: { packageId: id } });
        const dbBenefits = await tx.benefit.findMany({
          where: { id: { in: benefits.map(b => b.benefitId) } }
        });
        const benefitMap = {};
        dbBenefits.forEach(b => {
          benefitMap[b.id] = normalizeUnit(b.unitLabel);
        });

        await tx.packageBenefit.createMany({
          data: benefits.map((b, idx) => ({
            packageId: id,
            benefitId: b.benefitId,
            unitsIncluded: b.unitsIncluded ?? b.monthlyUnits ?? 1,
            unitsPeriod: b.unitsPeriod ?? 'monthly',
            unit: benefitMap[b.benefitId] || 'visits',
            isUnlimited: b.isUnlimited ?? false,
            allowRollover: b.allowRollover ?? false,
            displayOrder: idx,
          })),
        });
      }

      // 3. Update legacy features array from confirmed DB state
      let visitsPerWeek = 0;
      let hoursPerMonth = 0;
      let features = [];
      const updatedBenefits = await tx.packageBenefit.findMany({
        where: { packageId: id },
        include: { benefit: true }
      });
      updatedBenefits.forEach(pb => {
        const units = pb.unitsIncluded;
        const label = pb.benefit?.unitLabel || 'visits';
        features.push(`${units} ${label.replace(/^per\s+/i, '')}`);
        if (label.toLowerCase().includes('visit')) visitsPerWeek += Math.round(units / 4);
        if (label.toLowerCase().includes('hour')) hoursPerMonth += units;
      });
      await tx.subscriptionPackage.update({
        where: { id: id },
        data: { features, visitsPerWeek, hoursPerMonth }
      });

      // 4. Handle Discounts (delete and recreate)
      if (discounts.length > 0) {
        await tx.packageDiscount.deleteMany({ where: { packageId: id } });
        await tx.packageDiscount.createMany({
          data: discounts.map((d) => ({
            packageId: id,
            billingCycle: d.billingCycle,
            discountType: d.discountType ?? 'percentage',
            discountValue: d.discountValue ?? 0,
            isActive: d.isActive ?? true,
          })),
        });
      }

      return tx.subscriptionPackage.findUnique({
        where: { id },
        include: {
          packageBenefits: { include: { benefit: true } },
          packageDiscounts: true,
        },
      });
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('PUT package error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/packages/:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    await prisma.subscriptionPackage.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Package deactivated' });
  } catch (err) {
    if (err.code === 'P2025')
      return res
        .status(404)
        .json({ success: false, message: 'Package not found' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/packages/:id/benefits — replace all benefits on a package
router.post('/:id/benefits', async (req, res) => {
  const { id } = req.params;
  const { benefits = [] } = req.body;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.packageBenefit.deleteMany({ where: { packageId: id } });
      if (benefits.length > 0) {
        const dbBenefits = await tx.benefit.findMany({
          where: { id: { in: benefits.map(b => b.benefitId) } }
        });
        const benefitMap = {};
        dbBenefits.forEach(b => {
          benefitMap[b.id] = normalizeUnit(b.unitLabel);
        });

        await tx.packageBenefit.createMany({
          data: benefits.map((b, idx) => ({
            packageId: id,
            benefitId: b.benefitId,
            unitsIncluded: b.unitsIncluded ?? 1,
            unitsPeriod: b.unitsPeriod ?? 'monthly',
            unit: benefitMap[b.benefitId] || 'visits',
            isUnlimited: b.isUnlimited ?? false,
            displayOrder: idx,
          })),
        });
      }
    });
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id },
      include: { packageBenefits: { include: { benefit: true } } },
    });
    res.json({ success: true, data: pkg });
  } catch (err) {
    console.error('POST packages/:id/benefits error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
