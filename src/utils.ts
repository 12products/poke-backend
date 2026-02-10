import { set, add } from 'date-fns'

/**
 *
 * @param time : date object
 * @returns : date object with month, day, year, seconds, and milliseconds hardcoded
 */
export const getNotificationTime = (date: Date): Date => {
  return set(date, {
    month: 1,
    date: 1,
    year: 2001,
    seconds: 0,
    milliseconds: 0,
  })
}
/**
 *
 * @param nextSendTime : Date of current time
 * @param tries : number of tries message has already been sent, starts at 1
 * @returns : a date object with specific date in UTC
 */

export const getNextSendTime = (nextSendTime: Date, tries: number): Date => {
  return getNotificationTime(add(nextSendTime, { hours: tries }))
}

/**
 * Generates a motivational message based on streak count
 * @param streakCount : number of consecutive successful days
 * @returns : motivational message string
 */
export const getMotivationalMessage = (streakCount: number): string => {
  if (streakCount === 0) {
    return "Every journey begins with a single step! 🚀"
  } else if (streakCount === 1) {
    return "Great start! Keep the momentum going! 💪"
  } else if (streakCount < 7) {
    return `${streakCount} days strong! You're building a habit! 🔥`
  } else if (streakCount < 30) {
    return `Wow! ${streakCount} day streak! You're unstoppable! ⭐`
  } else if (streakCount < 100) {
    return `Incredible! ${streakCount} days! You're a legend! 🏆`
  } else {
    return `${streakCount} DAYS?! You're a superhuman! 🦸`
  }
}

/**
 * Gets a random emoji from the available emojis
 * @param emojis : array of emoji strings
 * @returns : random emoji string
 */
export const getRandomEmoji = (emojis: string[]): string => {
  return emojis[Math.floor(Math.random() * emojis.length)]
}
