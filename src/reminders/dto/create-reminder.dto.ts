export class CreateReminderDto {
  text: string
  notificationTime: string // ISO date string
  notificationDays: number[] // Array of day indices (0-6)
  timeZone: string
  color?: string
}
