export class CreateReminderDto {
  text: string
  notificationTime: Date
  notificationDays: number[]
  timeZone: string
  color?: string
}
