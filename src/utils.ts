// Why did the date function break up with the time function? It needed more space! ⏰
import { set, add } from 'date-fns'

/**
 * Time flies like an arrow. Fruit flies like a banana. 🍌
 *
 * @param time : date object
 * @returns : date object with month, day, year, seconds, and milliseconds hardcoded
 */
export const getNotificationTime = (date: Date): Date => {
  return set(date, {
    month: 1,
    date: 1,
    year: 2001, // Y2K called, they want their timestamp back 📞
    seconds: 0,
    milliseconds: 0,
  })
}
/**
 * If at first you don't succeed, try, try again. Then quit. No use being a fool about it.
 *
 * @param nextSendTime : Date of current time
 * @param tries : number of tries message has already been sent, starts at 1
 * @returns : a date object with specific date in UTC
 */

export const getNextSendTime = (nextSendTime: Date, tries: number): Date => {
  // Adding hours like we're adding features: one at a time, with hope and prayer 🙏
  return getNotificationTime(add(nextSendTime, { hours: tries }))
}
