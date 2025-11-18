import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'

@Controller()
export class AppController {
  @Public()
  @Get()
  healthCheck(): string {
    // Easter egg: Random encouraging messages
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()
    const random = Math.random()

    // Friday the 13th easter egg
    if (now.getDate() === 13 && dayOfWeek === 5) {
      return '🍀 OK (but it\'s Friday the 13th... stay lucky!)'
    }

    // Weekend vibes
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return '🌴 OK (enjoying the weekend, I see!)'
    }

    // Late night coding
    if (hour >= 23 || hour < 6) {
      return '🌙 OK (still grinding? You\'re a legend!)'
    }

    // Random rare messages (5% chance)
    if (random < 0.05) {
      const rareMessages = [
        '✨ OK (and you\'re doing great!)',
        '🚀 OK (to the moon!)',
        '🎯 OK (nailed it!)',
        '💎 OK (stay brilliant!)',
        '🔥 OK (on fire today!)',
        '🎨 OK (creating magic!)',
        '🎪 OK (welcome to the show!)',
      ]
      return rareMessages[Math.floor(Math.random() * rareMessages.length)]
    }

    // Standard OK response
    return 'OK'
  }
}
