import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'

@Controller()
export class AppController {
  @Public()
  @Get()
  healthCheck(): string {
    return 'OK'
  }

  // 🎮 Easter Egg: Konami Code Endpoint
  // Try: GET /konami or GET /up-up-down-down
  @Public()
  @Get('konami')
  konamiCode(): object {
    return {
      achievement: '🎮 KONAMI CODE UNLOCKED! 🎮',
      message: 'You found the secret! You are now a certified Poke Master!',
      secret: 'Try texting all 11 emojis in order to unlock the ultimate achievement...',
      hint: '🦄🥰🍔🙉🍎😇🦊🍉🤩🦁😜',
      bonus: 'Accountability level: LEGENDARY',
      timestamp: new Date().toISOString(),
    }
  }

  @Public()
  @Get('up-up-down-down')
  konamiCodeAlt(): object {
    return this.konamiCode()
  }

  // 🏆 Easter Egg: Secret Achievement Vault
  @Public()
  @Get('easter-egg')
  easterEgg(): object {
    return {
      message: '🥚 You found the easter egg! 🥚',
      achievements: [
        '🎮 Konami Code Master - Visit /konami',
        '🌈 Emoji Collector - Text all 11 emojis in sequence',
        '🔥 Streak Legend - Complete 7+ reminders in a row',
        '🧘 Zen Master - Create a reminder with "Breathe"',
      ],
      secret: 'The real accountability was the friends we made along the way',
    }
  }

  // 🎯 Easter Egg: Developer Credits
  @Public()
  @Get('credits')
  credits(): object {
    return {
      project: 'Poke Backend',
      tagline: 'Accountability through SMS, one emoji at a time',
      builtWith: '❤️ and ☕',
      powerLevel: 'Over 9000',
      secretFeatures: 3,
      hiddenEndpoints: '👀',
    }
  }
}
