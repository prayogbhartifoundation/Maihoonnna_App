import prisma from '../core/database';

/**
 * Medication Notification Worker
 * 
 * Runs every 60 seconds to inspect active medication schedules.
 * Dispatches on-time medication reminders at the exact scheduled time slot,
 * ensuring reminders are neither sent earlier nor delayed.
 */
let workerInterval: NodeJS.Timeout | null = null;

export function startMedicationWorker() {
  if (workerInterval) {
    console.log('[MedicationWorker] Worker already running.');
    return;
  }

  console.log('⏰ [MedicationWorker] Background medication notification worker started.');

  // Run immediately on boot, then every 60 seconds
  checkAndDispatchMedicationReminders();
  workerInterval = setInterval(checkAndDispatchMedicationReminders, 60 * 1000);
}

export function stopMedicationWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[MedicationWorker] Worker stopped.');
  }
}

async function checkAndDispatchMedicationReminders() {
  try {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Query active medications active for today
    const activeMedications = await prisma.medication.findMany({
      where: {
        isActive: true,
        startDate: { lte: todayEnd },
        OR: [
          { endDate: null },
          { endDate: { gte: todayStart } }
        ]
      },
      include: {
        beneficiary: {
          select: {
            id: true,
            userId: true,
            user: { select: { id: true, name: true, fcmToken: true } }
          }
        }
      }
    });

    if (activeMedications.length === 0) return;

    for (const med of activeMedications) {
      if (!med.beneficiary?.userId) continue;

      // Determine time slots for this medication
      let slots: string[] = med.timeSlots || [];
      if (slots.length === 0) {
        if (med.frequency === 'once_daily') slots = ['08:00 AM'];
        else if (med.frequency === 'twice_daily') slots = ['08:00 AM', '08:00 PM'];
        else if (med.frequency === 'thrice_daily') slots = ['08:00 AM', '02:00 PM', '08:00 PM'];
        else slots = ['08:00 AM'];
      }

      for (const slot of slots) {
        const slotTime = parseTimeSlot(slot, now);
        const slotHours = slotTime.getHours();
        const slotMinutes = slotTime.getMinutes();

        // Check if current time matches the scheduled slot time (same hour and minute)
        const isExactMatch = currentHours === slotHours && currentMinutes === slotMinutes;

        if (isExactMatch) {
          // Check if notification already dispatched for this medication + slot today
          const existingNotif = await prisma.notification.findFirst({
            where: {
              userId: med.beneficiary.userId,
              type: 'medication_reminder',
              createdAt: { gte: todayStart, lte: todayEnd },
              data: {
                path: ['medicationId'],
                equals: med.id
              }
            }
          });

          // Also check by json matching if path filter isn't supported in all DB drivers
          const todayNotifications = await prisma.notification.findMany({
            where: {
              userId: med.beneficiary.userId,
              type: 'medication_reminder',
              createdAt: { gte: todayStart, lte: todayEnd }
            }
          });

          const alreadyDispatched = todayNotifications.some((n: any) => {
            const dataObj = n.data as any;
            return dataObj && dataObj.medicationId === med.id && dataObj.timeSlot === slot;
          });

          if (!alreadyDispatched) {
            const title = `💊 Medication Reminder: ${med.name}`;
            const body = `It's time to take your ${med.dosage || ''} dose of ${med.name}. ${med.instructions ? `(${med.instructions})` : ''}`;

            // Create notification record in DB
            await prisma.notification.create({
              data: {
                userId: med.beneficiary.userId,
                type: 'medication_reminder',
                channel: 'push',
                title,
                body,
                data: {
                  medicationId: med.id,
                  medicationName: med.name,
                  dosage: med.dosage,
                  timeSlot: slot,
                  scheduledTimeIso: slotTime.toISOString()
                }
              }
            });

            console.log(`⏰ [MedicationWorker] Dispatched ON-TIME reminder for "${med.name}" (${slot}) to user ${med.beneficiary.user?.name || med.beneficiary.userId}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ [MedicationWorker] Error running background check:', error);
  }
}

function parseTimeSlot(slot: string, referenceDate: Date): Date {
  const date = new Date(referenceDate);
  let hours = 8;
  let minutes = 0;

  const cleaned = slot.trim().toUpperCase();
  if (cleaned === 'MORNING') {
    hours = 8; minutes = 0;
  } else if (cleaned === 'AFTERNOON') {
    hours = 14; minutes = 0;
  } else if (cleaned === 'EVENING') {
    hours = 18; minutes = 0;
  } else if (cleaned === 'NIGHT') {
    hours = 21; minutes = 30;
  } else {
    const timeParts = cleaned.split(':');
    if (timeParts.length >= 2) {
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1].substring(0, 2), 10);

      if (cleaned.endsWith('PM') && hours < 12) {
        hours += 12;
      } else if (cleaned.endsWith('AM') && hours === 12) {
        hours = 0;
      }
    }
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
}
