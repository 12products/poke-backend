export class UpdateReminderDto {
  text?: string
  notificationTime?: Date
  notificationDays?: number[]
  timeZone?: string
  color?: string
}
