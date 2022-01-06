export class CreateReminderDto {
  title: string;
  description: string;
  notificationDays: number[];
  notificationTime: Date;
}
