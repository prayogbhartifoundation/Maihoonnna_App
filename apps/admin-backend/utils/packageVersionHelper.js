const normalizeUnit = (unitLabel) => {
  if (!unitLabel) return 'visits';
  const clean = unitLabel.replace(/^per\s+/i, '').trim().toLowerCase();
  if (clean === 'visit') return 'visits';
  if (clean === 'hour') return 'hours';
  if (clean === 'session') return 'sessions';
  if (clean === 'test') return 'tests';
  if (clean.endsWith('s')) return clean;
  return clean + 's';
};

/**
 * Creates a new PackageVersion and PackageVersionBenefit records for the given SubscriptionPackage.
 * Marks any previous versions of this package as isLatest = false.
 * Should be run inside a transaction (tx).
 * 
 * @param {object} tx - Prisma transaction client
 * @param {string} packageId - The UUID of the SubscriptionPackage
 * @returns {Promise<object>} The newly created PackageVersion
 */
async function publishPackageVersion(tx, packageId) {
  // 1. Fetch SubscriptionPackage with benefits
  const pkg = await tx.subscriptionPackage.findUnique({
    where: { id: packageId },
    include: {
      packageBenefits: {
        include: {
          benefit: true,
        },
      },
    },
  });

  if (!pkg) {
    throw new Error(`SubscriptionPackage not found with id: ${packageId}`);
  }

  const packageCode = pkg.type;

  // 2. Find the current max version for this packageCode
  const maxVersionRecord = await tx.packageVersion.findFirst({
    where: { packageCode },
    orderBy: { version: 'desc' },
    select: { version: true },
  });

  const nextVersion = maxVersionRecord ? maxVersionRecord.version + 1 : 1;

  // 3. Mark all previous versions as not latest
  await tx.packageVersion.updateMany({
    where: { packageCode, isLatest: true },
    data: { isLatest: false },
  });

  // 4. Create the new PackageVersion record
  const newVersion = await tx.packageVersion.create({
    data: {
      packageCode,
      version: nextVersion,
      name: pkg.name,
      tagline: pkg.tagline,
      description: pkg.description,
      basePrice: pkg.basePrice,
      mrp: pkg.mrp,
      currency: pkg.currency,
      billingCycle: pkg.billingCycle,
      durationMonths: pkg.durationMonths,
      isFreeTrial: pkg.isFreeTrial,
      trialDurationDays: pkg.trialDurationDays,
      visitsPerWeek: pkg.visitsPerWeek,
      hoursPerMonth: pkg.hoursPerMonth,
      maxBeneficiaries: pkg.maxBeneficiaries,
      features: pkg.features,
      highlightFeatures: pkg.highlightFeatures,
      color: pkg.color,
      isPopular: pkg.isPopular,
      isLatest: true,
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder,
      discountPercentage: pkg.discountPercentage,
      miscellaneousCost: pkg.miscellaneousCost,
    },
  });

  // 5. Create PackageVersionBenefit records copying from current package benefits
  if (pkg.packageBenefits.length > 0) {
    await tx.packageVersionBenefit.createMany({
      data: pkg.packageBenefits.map((pb) => ({
        packageVersionId: newVersion.id,
        benefitId: pb.benefitId,
        snapshotName: pb.benefit?.name || 'Benefit',
        snapshotUnitLabel: pb.benefit?.unitLabel || 'visits',
        unitsIncluded: pb.unitsIncluded,
        unitsPeriod: pb.unitsPeriod,
        isUnlimited: pb.isUnlimited,
        displayOrder: pb.displayOrder,
        notes: pb.notes,
      })),
    });
  }

  console.log(`[publishPackageVersion] Published ${packageCode} version ${nextVersion} (id: ${newVersion.id}) with ${pkg.packageBenefits.length} benefits.`);
  return newVersion;
}

module.exports = {
  publishPackageVersion,
};
