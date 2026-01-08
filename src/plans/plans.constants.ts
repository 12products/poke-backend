export interface Plan {
  id: string
  name: string
  price: number // Monthly price in cents
  reminderLimit: number // -1 for unlimited
  features: string[]
}

export const MOCK_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    reminderLimit: 1,
    features: ['1 reminder', 'SMS notifications', 'Basic streak tracking'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    reminderLimit: 5,
    features: [
      'Up to 5 reminders',
      'SMS notifications',
      'Advanced streak tracking',
      'Priority support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 999,
    reminderLimit: -1,
    features: [
      'Unlimited reminders',
      'SMS notifications',
      'Advanced streak tracking',
      'Priority support',
      'Custom reminder colors',
      'Early access to new features',
    ],
  },
]
