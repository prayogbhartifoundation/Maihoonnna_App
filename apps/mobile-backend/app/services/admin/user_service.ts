import prisma from '../../core/database';

export const getUser = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  return user;
};

export const updateUser = async (userId: string, updates: Record<string, unknown>) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: updates,
  });
  return user;
};

export const getCompanionProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      careCompanionProfile: {
        include: {
          visits: {
            where: { status: 'completed' }
          }
        }
      }
    }
  });

  if (!user || !user.careCompanionProfile) throw new Error('Companion profile not found');

  const cc = user.careCompanionProfile;

  let totalHours = 0;
  const clientIds = new Set<string>();

  cc.visits.forEach((v: any) => {
    clientIds.add(v.beneficiaryId);
    if (v.checkInTime && v.checkOutTime) {
      const ms = new Date(v.checkOutTime).getTime() - new Date(v.checkInTime).getTime();
      totalHours += ms / (1000 * 60 * 60);
    }
  });

  return {
    id: user.id,
    ccId: cc.id,
    name: cc.name,
    email: user.email,
    phone: user.phone,
    location: user.location || cc.zone || 'San Francisco, CA',
    photo: cc.photo,
    verified: true,
    memberSince: user.createdAt.toISOString(),
    stats: {
      totalVisits: cc.visits.length,
      hours: Math.round(totalHours),
      clients: clientIds.size
    }
  };
};