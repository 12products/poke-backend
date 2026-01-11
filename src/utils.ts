import { set, add } from 'date-fns'

export const getNotificationTime = (date: Date): Date => {
  return set(date, {
    month: 1,
    date: 1,
    year: 2001,
    seconds: 0,
    milliseconds: 0,
  })
}

export const getNextSendTime = (nextSendTime: Date, tries: number): Date => {
  return getNotificationTime(add(nextSendTime, { hours: tries }))
}
