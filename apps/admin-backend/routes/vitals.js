/**
 * Vitals API Routes — wired to the live Prisma schema
 *
 * Schema field reference:
 *   VitalDefinition:        id, code, name, description, unit, dataType,
 *                           normalMin, normalMax, isSystemVital, displayOrder,
 *                           iconCode, isActive
 *   VitalConfigTemplate:    id, name, description, isDefault, isActive
 *   VitalTemplateItem:      templateId, vitalDefinitionId, isMandatory,
 *                           frequency, displayOrder
 *   BeneficiaryVitalConfig: beneficiaryId, vitalDefinitionId, templateId,
 *                           isActive, isMandatory, frequency
 *   VitalReading:           beneficiaryId, vitalDefinitionId, capturedById,
 *                           valueNumeric, valueNumeric2, valueText, isAbnormal
 *
 * IMPORTANT: Named sub-routes (/templates, /readings, /beneficiary-configs)
 *            are declared BEFORE /:id to prevent Express shadowing.
 */
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// ─── GET /api/vitals ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { activeOnly } = req.query;
  try {
    const where = {};
    if (activeOnly === 'true') where.isActive = true;
    const vitals = await prisma.vitalDefinition.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });
    res.json({ success: true, data: vitals });
  } catch (err) {
    console.error('GET /vitals error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/vitals ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    code, name, unit, dataType, normalMin, normalMax, description, displayOrder,
    inputMin, inputMax,
    value1Label, value2Label, normalMin2, normalMax2,
    textOptions, alertOptions,
    booleanTrueLabel, booleanFalseLabel, booleanAlertValue
  } = req.body;
  if (!code || !name || !dataType) {
    return res.status(400).json({ success: false, message: 'code, name, and dataType are required' });
  }
  try {
    const vital = await prisma.vitalDefinition.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        unit: unit || null,
        dataType,
        inputMin: inputMin != null && inputMin !== '' ? parseFloat(inputMin) : null,
        inputMax: inputMax != null && inputMax !== '' ? parseFloat(inputMax) : null,
        normalMin: normalMin != null && normalMin !== '' ? parseFloat(normalMin) : null,
        normalMax: normalMax != null && normalMax !== '' ? parseFloat(normalMax) : null,
        description: description || null,
        displayOrder: parseInt(displayOrder) || 0,
        // Dual numeric
        value1Label: value1Label || null,
        value2Label: value2Label || null,
        normalMin2: normalMin2 != null && normalMin2 !== '' ? parseFloat(normalMin2) : null,
        normalMax2: normalMax2 != null && normalMax2 !== '' ? parseFloat(normalMax2) : null,
        // Text
        textOptions: Array.isArray(textOptions) ? textOptions : [],
        alertOptions: Array.isArray(alertOptions) ? alertOptions : [],
        // Boolean
        booleanTrueLabel: booleanTrueLabel || null,
        booleanFalseLabel: booleanFalseLabel || null,
        booleanAlertValue: booleanAlertValue != null ? Boolean(booleanAlertValue) : null,
        isActive: true,
        isSystemVital: false,
      },
    });
    // Normalize response field name for frontend
    res.status(201).json({ success: true, data: { ...vital, isSystem: vital.isSystemVital } });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: `A vital with code "${code}" already exists` });
    }
    console.error('POST /vitals error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/vitals/templates ──────────────────────────────────────────────
router.get('/templates', async (req, res) => {
  try {
    const templates = await prisma.vitalConfigTemplate.findMany({
      orderBy: { name: 'asc' },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' },
          include: { vitalDefinition: true },
        },
        appliedConfigs: { select: { id: true } },
      },
    });

    const transformed = templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      isDefault: t.isDefault,
      isActive: t.isActive,
      beneficiaryCount: t.appliedConfigs.length,
      items: t.items.map(i => ({
        vitalCode: i.vitalDefinition.code,
        vitalName: i.vitalDefinition.name,
        frequency: i.frequency || 'every_visit',
        isMandatory: i.isMandatory,
      })),
    }));

    res.json({ success: true, data: transformed });
  } catch (err) {
    console.error('GET /vitals/templates error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/vitals/templates ─────────────────────────────────────────────
router.post('/templates', async (req, res) => {
  const { name, description, isDefault, items } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'name is required' });
  try {
    const template = await prisma.vitalConfigTemplate.create({
      data: {
        name,
        description: description || null,
        isDefault: !!isDefault,
        isActive: true,
        items: items
          ? {
              create: items.map((item, idx) => ({
                vitalDefinitionId: item.vitalDefinitionId,
                frequency: item.frequency || 'every_visit',
                isMandatory: !!item.isMandatory,
                displayOrder: idx,
              })),
            }
          : undefined,
      },
    });
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    console.error('POST /vitals/templates error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/vitals/beneficiary-configs ────────────────────────────────────
router.get('/beneficiary-configs', async (req, res) => {
  try {
    const configs = await prisma.beneficiaryVitalConfig.findMany({
      include: {
        beneficiary: true,
        vitalDefinition: true,
        template: true,
      },
      orderBy: { beneficiaryId: 'asc' },
    });

    // Group by beneficiary
    const grouped = {};
    configs.forEach(c => {
      if (!grouped[c.beneficiaryId]) {
        grouped[c.beneficiaryId] = {
          id: c.beneficiaryId,
          name: c.beneficiary.name,
          age: 0,
          zoneName: 'Default Zone',
          templateName: c.template?.name || 'Standard care',
          vitals: [],
        };
      }
      grouped[c.beneficiaryId].vitals.push({
        vitalCode: c.vitalDefinition.code,
        vitalName: c.vitalDefinition.name,
        frequency: c.frequency,
        isEnabled: c.isActive,
        isOverridden: !c.templateId,
      });
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (err) {
    console.error('GET /vitals/beneficiary-configs error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/vitals/readings ────────────────────────────────────────────────
router.get('/readings', async (req, res) => {
  const { beneficiaryId, status } = req.query;
  try {
    const where = {};
    if (beneficiaryId) where.beneficiaryId = beneficiaryId;
    if (status === 'abnormal') where.isAbnormal = true;

    const readings = await prisma.vitalReading.findMany({
      where,
      include: {
        beneficiary: true,
        capturedBy: true,
        vitalDefinition: true,
      },
      orderBy: { capturedAt: 'desc' },
      take: 100,
    });

    const transformed = readings.map(r => {
      // Build display value from the appropriate value field
      let readingValue = '—';
      if (r.valueNumeric !== null && r.valueNumeric2 !== null) {
        readingValue = `${r.valueNumeric}/${r.valueNumeric2}`;
      } else if (r.valueNumeric !== null) {
        readingValue = String(r.valueNumeric);
      } else if (r.valueText) {
        readingValue = r.valueText;
      }

      return {
        id: r.id,
        beneficiaryName: r.beneficiary?.name || 'Unknown',
        careCompanionName: r.capturedBy?.name || 'Unknown',
        vitalCode: r.vitalDefinition?.code || '',
        vitalName: r.vitalDefinition?.name || '',
        readingValue,
        unit: r.unit || r.vitalDefinition?.unit || null,
        status: r.isAbnormal ? 'abnormal' : 'normal',
        capturedAt: r.capturedAt,
        method: r.captureMethod || 'manual',
      };
    });

    res.json({ success: true, data: transformed });
  } catch (err) {
    console.error('GET /vitals/readings error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/vitals/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const vital = await prisma.vitalDefinition.findUnique({ where: { id: req.params.id } });
    if (!vital) return res.status(404).json({ success: false, message: 'Vital not found' });
    res.json({ success: true, data: { ...vital, isSystem: vital.isSystemVital } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/vitals/:id ───────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  // Strip non-updatable fields
  const { id: _id, createdAt, updatedAt, isSystem, ...rest } = req.body;
  // Map isSystem → isSystemVital if passed
  const data = { ...rest };
  if (req.body.isSystem !== undefined) data.isSystemVital = req.body.isSystem;

  // Parse numeric fields safely
  const numericFields = ['inputMin', 'inputMax', 'normalMin', 'normalMax', 'normalMin2', 'normalMax2'];
  numericFields.forEach(f => {
    if (data[f] !== undefined) {
      data[f] = (data[f] != null && data[f] !== '') ? parseFloat(data[f]) : null;
    }
  });

  // Parse array fields
  if (data.textOptions !== undefined && !Array.isArray(data.textOptions)) {
    data.textOptions = [];
  }
  if (data.alertOptions !== undefined && !Array.isArray(data.alertOptions)) {
    data.alertOptions = [];
  }

  // Parse boolean alert value
  if (data.booleanAlertValue !== undefined) {
    data.booleanAlertValue = data.booleanAlertValue != null ? Boolean(data.booleanAlertValue) : null;
  }

  if (data.displayOrder !== undefined) data.displayOrder = parseInt(data.displayOrder) || 0;

  try {
    const vital = await prisma.vitalDefinition.update({ where: { id }, data });
    res.json({ success: true, data: { ...vital, isSystem: vital.isSystemVital } });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Vital not found' });
    console.error('PATCH /vitals/:id error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/vitals/:id (soft delete) ───────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await prisma.vitalDefinition.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Vital deactivated' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Vital not found' });
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
