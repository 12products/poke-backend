export interface User {
  id: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  schedule: ReminderSchedule;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderSchedule {
  days: number[];
  time: string;
  timezone: string;
}

export interface ReminderCompletion {
  id: string;
  reminderId: string;
  completedAt: Date;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type ReminderStatus = 'pending' | 'sent' | 'completed' | 'snoozed' | 'failed';

export interface Message {
  id: string;
  reminderId: string;
  status: ReminderStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  respondedAt?: Date;
  response?: string;
}
