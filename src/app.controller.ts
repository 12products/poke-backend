import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'

@Controller()
export class AppController {
  @Public()
  @Get()
  healthCheck(): string {
    return 'OK'
  }

  @Public()
  @Get('konami')
  easterEgg(): { message: string; secret: boolean } {
    const messages = [
      "You found the secret! Here's your reward: Keep crushing those goals! 💪",
      "Achievement unlocked: Master Procrastinator Detector 🏆",
      "Congrats! You've been poked by the easter egg. Now go poke yourself to be productive!",
      "Secret message: The real poke was the friends we made along the way... Just kidding, go do your tasks!",
      "You discovered the konami endpoint! As a reward, here's a reminder: You're doing great!",
      "Hidden achievement: You're supposed to be working on your goals right now, aren't you? 😏",
      "Easter egg activated! Fun fact: 73% of people who find easter eggs immediately forget what they were doing.",
      "Congratulations! Your reward is... accountability! (Sorry, we don't do refunds)",
      "You've unlocked the secret poke! Use this power wisely... or just get back to work.",
      "The ancient texts foretold of one who would find this endpoint. That person is you. Now go accomplish something!"
    ]

    const randomMessage = messages[Math.floor(Math.random() * messages.length)]

    return {
      message: randomMessage,
      secret: true
    }
  }
}
