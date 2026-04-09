import prisma from '../app/core/database';

async function main() {
  console.log('🌱 Seeding 4 standardized subscription packages...');

  const packages = [
    {
      type: 'basic',
      name: 'Basic Care',
      tagline: 'Essential support for independent seniors',
      description: 'Ideal for seniors who need minimal assistance but want regular health check-ins.',
      basePrice: 4999,
      mrp: 5999,
      discountPercentage: 16,
      billingCycle: 'monthly',
      hoursPerMonth: 12,
      visitsPerWeek: 1,
      maxBeneficiaries: 1,
      features: [
        'Weekly Health Check-ins',
        'Vitals Monitoring',
        'Basic Medical Concierge',
        'Emergency Support Lite'
      ],
      color: '#94A3B8',
      isActive: true,
      sortOrder: 1
    },
    {
      type: 'standard',
      name: 'Standard Care',
      tagline: 'Holistic care for active aging',
      description: 'Comprehensive support including medical records management and regular companion visits.',
      basePrice: 9999,
      mrp: 12499,
      discountPercentage: 20,
      billingCycle: 'monthly',
      hoursPerMonth: 24,
      visitsPerWeek: 2,
      maxBeneficiaries: 1,
      features: [
        'Everything in Basic',
        'Bi-weekly Companion Visits',
        'Family Portal Access',
        'Medical Records Digitalization',
        'Medication Reminders'
      ],
      color: '#F97316',
      isActive: true,
      sortOrder: 2
    },
    {
      type: 'premium',
      name: 'Premium Care',
      tagline: 'High-touch personal care management',
      description: 'Our most popular plan, offering frequent visits and dedicated healthcare coordination.',
      basePrice: 19999,
      mrp: 24999,
      discountPercentage: 20,
      billingCycle: 'monthly',
      hoursPerMonth: 60,
      visitsPerWeek: 5,
      maxBeneficiaries: 2,
      features: [
        'Everything in Standard',
        'Daily Vitals Trending',
        'Dedicated Care Manager',
        'Doctor Coordination',
        'Post-Hospitalization Support',
        '24/7 Priority Emergency Response'
      ],
      color: '#EA580C',
      isPopular: true,
      isActive: true,
      sortOrder: 3
    },
    {
      type: 'ultimate',
      name: 'Ultimate Care',
      tagline: 'The gold standard of senior care',
      description: 'Exclusive, highly personalized care plan with 24/7 dedicated companion availability.',
      basePrice: 39999,
      mrp: 49999,
      discountPercentage: 20,
      billingCycle: 'monthly',
      hoursPerMonth: 120,
      visitsPerWeek: 7,
      maxBeneficiaries: 2,
      features: [
        'Everything in Premium',
        'Daily Companion Presence',
        'Full-Time Health Advocate',
        'Quarterly Health Audits',
        'Customized Dietary & Mobility Plan',
        'Unlimited Specialist Referrals'
      ],
      color: '#111827',
      isActive: true,
      sortOrder: 4
    }
  ];

  for (const pkg of packages) {
    await prisma.subscriptionPackage.upsert({
      where: { type: pkg.type },
      update: pkg,
      create: pkg,
    });
  }

  console.log('✅ Successfully seeded 4 packages.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
