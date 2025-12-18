import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: 'free',
      displayName: 'Free',
      price: 0,
      interval: 'month',
      maxReminders: 1,
      features: ['1 reminder', 'SMS notifications', 'Basic analytics'],
      isActive: true,
    },
    {
      name: 'basic',
      displayName: 'Basic',
      price: 4.99,
      interval: 'month',
      maxReminders: 5,
      features: [
        '5 reminders',
        'SMS notifications',
        'Priority support',
        'Custom colors',
      ],
      isActive: true,
    },
    {
      name: 'premium',
      displayName: 'Premium',
      price: 9.99,
      interval: 'month',
      maxReminders: -1, // -1 = unlimited
      features: [
        'Unlimited reminders',
        'SMS notifications',
        'Priority support',
        'Custom colors',
        'Advanced analytics',
        'API access',
      ],
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  console.log('Seeded plans:', plans.map((p) => p.name).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
