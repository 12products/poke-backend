import { PrismaClient } from '@prisma/client'
import { addHours, setHours, setMinutes } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🎭 Starting Poke Demo Seed...\n')

  // Create demo users
  console.log('Creating demo users...')

  const alice = await prisma.user.upsert({
    where: { phone: '+15555550101' },
    update: {},
    create: {
      phone: '+15555550101',
      name: 'Alice Johnson',
      onboarded: true,
    },
  })

  const bob = await prisma.user.upsert({
    where: { phone: '+15555550102' },
    update: {},
    create: {
      phone: '+15555550102',
      name: 'Bob Smith',
      onboarded: true,
    },
  })

  const charlie = await prisma.user.upsert({
    where: { phone: '+15555550103' },
    update: {},
    create: {
      phone: '+15555550103',
      name: 'Charlie Davis',
      onboarded: true,
    },
  })

  console.log(`✅ Created 3 demo users\n`)

  // Create diverse reminders for each user
  console.log('Creating demo reminders...')

  // Alice's reminders - Fitness enthusiast
  const aliceReminders = [
    {
      text: 'Morning workout time! 💪',
      notificationTime: setMinutes(setHours(new Date(), 6), 0),
      notificationDays: [1, 3, 5], // Mon, Wed, Fri
      emoji: '💪',
      color: 'red',
      timeZone: 'America/New_York',
      userId: alice.id,
    },
    {
      text: 'Did you drink 8 glasses of water today?',
      notificationTime: setMinutes(setHours(new Date(), 20), 0),
      notificationDays: [0, 1, 2, 3, 4, 5, 6], // Every day
      emoji: '💧',
      color: 'blue',
      timeZone: 'America/New_York',
      userId: alice.id,
    },
    {
      text: 'Yoga and stretching session',
      notificationTime: setMinutes(setHours(new Date(), 18), 30),
      notificationDays: [0, 2, 4, 6], // Sun, Tue, Thu, Sat
      emoji: '🧘',
      color: 'purple',
      timeZone: 'America/New_York',
      userId: alice.id,
    },
  ]

  // Bob's reminders - Professional development
  const bobReminders = [
    {
      text: 'Read for 30 minutes 📚',
      notificationTime: setMinutes(setHours(new Date(), 21), 0),
      notificationDays: [0, 1, 2, 3, 4, 5, 6], // Every day
      emoji: '📚',
      color: 'green',
      timeZone: 'America/Los_Angeles',
      userId: bob.id,
    },
    {
      text: 'Practice coding challenge',
      notificationTime: setMinutes(setHours(new Date(), 19), 0),
      notificationDays: [1, 2, 3, 4, 5], // Weekdays
      emoji: '💻',
      color: 'cyan',
      timeZone: 'America/Los_Angeles',
      userId: bob.id,
    },
    {
      text: 'Review your weekly goals',
      notificationTime: setMinutes(setHours(new Date(), 9), 0),
      notificationDays: [0], // Sunday
      emoji: '🎯',
      color: 'orange',
      timeZone: 'America/Los_Angeles',
      userId: bob.id,
    },
  ]

  // Charlie's reminders - Mental health and creativity
  const charlieReminders = [
    {
      text: 'Morning meditation 🧘‍♂️',
      notificationTime: setMinutes(setHours(new Date(), 7), 0),
      notificationDays: [0, 1, 2, 3, 4, 5, 6], // Every day
      emoji: '🧘‍♂️',
      color: 'indigo',
      timeZone: 'America/Chicago',
      userId: charlie.id,
    },
    {
      text: 'Gratitude journal - write 3 things',
      notificationTime: setMinutes(setHours(new Date(), 22), 0),
      notificationDays: [0, 1, 2, 3, 4, 5, 6], // Every day
      emoji: '📝',
      color: 'yellow',
      timeZone: 'America/Chicago',
      userId: charlie.id,
    },
    {
      text: 'Creative writing session',
      notificationTime: setMinutes(setHours(new Date(), 14), 0),
      notificationDays: [0, 3, 6], // Sun, Wed, Sat
      emoji: '✍️',
      color: 'pink',
      timeZone: 'America/Chicago',
      userId: charlie.id,
    },
    {
      text: 'Phone-free time before bed',
      notificationTime: setMinutes(setHours(new Date(), 21), 30),
      notificationDays: [0, 1, 2, 3, 4, 5, 6], // Every day
      emoji: '📵',
      color: 'gray',
      timeZone: 'America/Chicago',
      userId: charlie.id,
    },
  ]

  // Insert all reminders
  for (const reminder of [...aliceReminders, ...bobReminders, ...charlieReminders]) {
    await prisma.reminder.create({
      data: reminder,
    })
  }

  console.log(`✅ Created ${aliceReminders.length} reminders for Alice`)
  console.log(`✅ Created ${bobReminders.length} reminders for Bob`)
  console.log(`✅ Created ${charlieReminders.length} reminders for Charlie\n`)

  // Summary
  console.log('📊 Demo Data Summary:')
  console.log('═══════════════════════════════════════════════════')
  console.log(`👤 Alice (${alice.phone}): Fitness enthusiast`)
  console.log(`   - ${aliceReminders.length} reminders (workouts, hydration, yoga)`)
  console.log(`\n👤 Bob (${bob.phone}): Professional development`)
  console.log(`   - ${bobReminders.length} reminders (reading, coding, goal review)`)
  console.log(`\n👤 Charlie (${charlie.phone}): Mental health & creativity`)
  console.log(`   - ${charlieReminders.length} reminders (meditation, journaling, writing)\n`)
  console.log('═══════════════════════════════════════════════════')
  console.log('\n🎉 Demo seed completed successfully!')
  console.log('\n💡 Next steps:')
  console.log('   1. Start the server: yarn start:dev')
  console.log('   2. Check out the demo controller: GET /demo/info')
  console.log('   3. Trigger a test reminder: POST /demo/send-reminder/:reminderId')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding demo data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
