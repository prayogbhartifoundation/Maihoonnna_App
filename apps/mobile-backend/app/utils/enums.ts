export enum UserRole {
  SUBSCRIBER = 'subscriber',
  BENEFICIARY = 'beneficiary',
  CARE_COMPANION = 'care_companion',
  FIELD_MANAGER = 'field_manager',
  OPERATIONS_MANAGER = 'operations_manager',
  EMERGENCY_COORDINATOR = 'emergency_coordinator',
  VOLUNTEER = 'volunteer',
}


export enum VisitStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  MISSED = 'missed',
}

export enum MoodType {
  HAPPY = 'happy',
  NEUTRAL = 'neutral',
  SAD = 'sad',
  DEPRESSED = 'depressed',
}

export enum EmergencyStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
}