const express = require('express');
const router = express.Router();
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../../../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

// GET /api/coupons — list all coupons
router.get('/', async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// GET /api/coupons/:id — get one coupon
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await prisma.coupon.findUnique({
      where: { id }
    });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST /api/coupons — create a new coupon
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Check if code exists
    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type,
        discountValue: parseFloat(data.discountValue),
        minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null,
        maxDiscountAmount: data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive !== undefined ? data.isActive : true,
        isVisible: data.isVisible !== undefined ? data.isVisible : true,
        isAutoApply: data.isAutoApply || false,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit, 10) : null,
        perUserLimit: data.perUserLimit ? parseInt(data.perUserLimit, 10) : null,
        allowedPackages: data.allowedPackages || [],
        allowedUserRoles: data.allowedUserRoles || [],
        firstTimeOnly: data.firstTimeOnly || false,
        isStackable: data.isStackable || false,
        deviceLimit: data.deviceLimit ? parseInt(data.deviceLimit, 10) : null,
        ipLimit: data.ipLimit ? parseInt(data.ipLimit, 10) : null,
        campaignName: data.campaignName,
        source: data.source,
        createdBy: data.createdBy || 'Admin'
      }
    });

    res.json({ success: true, data: newCoupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
});

// PUT /api/coupons/:id — update an existing coupon
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Check code conflict if changing code (though code shouldn't change normally)
    if (data.code) {
      const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ success: false, message: 'Coupon code already exists' });
      }
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type,
        discountValue: data.discountValue !== undefined ? parseFloat(data.discountValue) : undefined,
        minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null,
        maxDiscountAmount: data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : null,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isActive: data.isActive,
        isVisible: data.isVisible,
        isAutoApply: data.isAutoApply,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit, 10) : null,
        perUserLimit: data.perUserLimit ? parseInt(data.perUserLimit, 10) : null,
        allowedPackages: data.allowedPackages,
        allowedUserRoles: data.allowedUserRoles,
        firstTimeOnly: data.firstTimeOnly,
        isStackable: data.isStackable,
        deviceLimit: data.deviceLimit ? parseInt(data.deviceLimit, 10) : null,
        ipLimit: data.ipLimit ? parseInt(data.ipLimit, 10) : null,
        campaignName: data.campaignName,
        source: data.source
      }
    });

    res.json({ success: true, data: updatedCoupon });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
});

// DELETE /api/coupons/:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.coupon.update({
      where: { id },
      data: { isActive: false, isVisible: false }
    });
    res.json({ success: true, message: 'Coupon deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to deactivate coupon' });
  }
});

// GET /api/coupons/analytics/stats
router.get('/analytics/stats', async (req, res) => {
  try {
    const totalCoupons = await prisma.coupon.count();
    const activeCoupons = await prisma.coupon.count({ where: { isActive: true } });
    
    // Total usages
    const usages = await prisma.couponUsage.aggregate({
      _sum: { discountApplied: true, orderAmount: true },
      _count: true
    });

    // Recent attempts (success vs fail)
    const attempts = await prisma.couponAttemptLog.groupBy({
      by: ['status'],
      _count: true
    });

    res.json({
      success: true,
      data: {
        totalCoupons,
        activeCoupons,
        totalUsages: usages._count || 0,
        totalDiscountGiven: usages._sum.discountApplied || 0,
        totalOrderValueWithCoupons: usages._sum.orderAmount || 0,
        attempts: attempts.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count }), {})
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

module.exports = router;
