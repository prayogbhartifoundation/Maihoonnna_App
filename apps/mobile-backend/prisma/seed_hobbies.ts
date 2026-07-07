import dotenv from 'dotenv';
dotenv.config();

import prisma from '../app/core/database';

const COMMON_HOBBIES = [
  'Reading',
  'Gardening',
  'Traveling',
  'Music',
  'Cooking',
  'Photography',
  'Yoga/Exercise',
  'Painting/Sketching',
  'Socializing',
  'Movies/TV',
  'Playing Cards/Board Games',
  'Other'
];

async function main() {
  console.log('🌱 Seeding Hobbies...');
  for (const name of COMMON_HOBBIES) {
    await prisma.hobby.upsert({
      where: { name },
      update: {},
      create: {
        name,
        isActive: true,
      },
    });
  }
  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
