import { Get, Controller, HttpCode, HttpStatus } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'

@Controller()
export class AppController {
  @Public()
  @Get()
  healthCheck(): string {
    // 95% chance of normal response, 5% chance of easter egg
    const random = Math.random()

    if (random < 0.95) {
      return 'OK'
    }

    // Easter egg messages
    const easterEggs = [
      'OK... but are YOU ok? 🤔',
      'All systems operational... unlike your sleep schedule 😴',
      'Still alive! 🎉',
      'Definitely not a robot 🤖 ...wait',
      '200 OK, but make it fashion 💅',
      'OK! *high five* ✋',
      'Working harder than your coffee ☕',
    ]

    return easterEggs[Math.floor(Math.random() * easterEggs.length)]
  }

  @Public()
  @Get('konami')
  konami(): object {
    return {
      message: '⬆️⬆️⬇️⬇️⬅️➡️⬅️➡️🅱️🅰️',
      achievement: 'Konami Code Master',
      reward: '30 extra lives! (Just kidding, but you found the secret endpoint! 🎮)',
      hint: 'The real treasure was the APIs we discovered along the way',
    }
  }

  @Public()
  @Get('teapot')
  @HttpCode(HttpStatus.I_AM_A_TEAPOT)
  teapot(): object {
    return {
      statusCode: 418,
      message: "I'm a teapot",
      error: 'Short and stout',
      tip: 'Here is my handle 🫖',
      pourTime: 'Here is my spout ☕',
      note: 'This is a reference to RFC 2324 - Hyper Text Coffee Pot Control Protocol',
    }
  }
}
