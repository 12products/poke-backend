// Why do programmers prefer dark mode? Because light attracts bugs! 🐛
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'

import { AppModule } from './app.module'

// How many programmers does it take to change a light bulb? None, that's a hardware problem.
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  )
  // Todo: need to update origin once we deploy
  // Fun fact: CORS stands for "Can't Obviously Recall Security" - at least that's what I tell myself 😅
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  })

  app.setGlobalPrefix('/v1')

  await app.listen(process.env.PORT || 3000)

  console.log(`Application is running on: ${await app.getUrl()}`)
  // Why did the developer go broke? Because they used up all their cache! 💸
}

bootstrap()
