export const getNotificationTime = (time: string | Date): Date => {
  const dateTime = new Date(time)
  const hour = `${dateTime.getUTCHours()}`.padStart(2, '0')
  const minutes = `${dateTime.getUTCMinutes()}`.padStart(2, '0')
  return new Date(`01/01/2001 ${hour}:${minutes} UTC`)
}

export const getNextSendTime = (nextSendTime: Date, tries: number): Date => {
  const sendTimeHours = (nextSendTime.getHours() + tries) % 24
  nextSendTime.setHours(sendTimeHours)
  return getNotificationTime(nextSendTime)
}
// tries = 1
// message created: send 1st message => nextSend = now + 1, tries = 2
// send 2nd message => nextSend = now + 2, tries = 3
// send 3rd message => next Send = now + 3, tries = 4
// send 4th message => next Send = now + 24 tries = 5 active: false
