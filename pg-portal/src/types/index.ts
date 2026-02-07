// User roles in the system
export type UserRole = 'student' | 'supervisor' | 'coordinator' | 'admin';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  studentNumber?: string;
  department?: string;
}

// HD Request status workflow states
export type HDRequestStatus =
  | 'draft'
  | 'submitted_to_supervisor'
  | 'supervisor_review'
  | 'co_supervisor_review'
  | 'coordinator_review'
  | 'fhd_pending'
  | 'shd_pending'
  | 'approved'
  | 'recommended'
  | 'referred_back';

// HD Request types
export type HDRequestType =
  | 'registration'
  | 'title_registration'
  | 'progress_report'
  | 'extension'
  | 'leave_of_absence'
  | 'supervisor_change'
  | 'examination_entry'
  | 'other';

// HD Request interface
export interface HDRequest {
  id: string;
  type: HDRequestType;
  title: string;
  status: HDRequestStatus;
  studentId: string;
  studentName: string;
  supervisorId: string;
  coSupervisorId?: string;
  coordinatorId?: string;
  createdAt: Date;
  updatedAt: Date;
  currentOwner: string;
  accessCode?: string;
  accessCodeExpiry?: Date;
  fhdOutcome?: 'approved' | 'recommended' | 'referred_back';
  shdOutcome?: 'approved' | 'referred_back';
  referenceNumber?: string;
  notes?: string;
}

// Calendar event interface
export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'deadline' | 'meeting' | 'event' | 'reminder';
  scope: 'all' | 'faculty' | 'department';
  description?: string;
}

// Milestone interface
export interface Milestone {
  id: string;
  studentId: string;
  title: string;
  type: 'conference' | 'journal_club' | 'workshop' | 'training' | 'publication' | 'other';
  date: Date;
  description?: string;
}

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: Date;
  link?: string;
}

// Student profile for academic progress
export interface StudentProfile {
  userId: string;
  studentNumber: string;
  programme: string;
  degree: string;
  faculty: string;
  department: string;
  registrationDate: Date;
  yearsRegistered: number;
  supervisorId: string;
  coSupervisorId?: string;
  thesisTitle?: string;
  status: 'active' | 'on_leave' | 'completed' | 'discontinued';
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
}
