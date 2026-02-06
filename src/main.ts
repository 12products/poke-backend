import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  )
  // Todo: need to update origin once we deploy
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  })

  app.setGlobalPrefix('/v1')

  const port = process.env.PORT || 3000
  await app.listen(port)

  console.log(`Application is running on: ${await app.getUrl()}`)
  console.log(`System status available at: /v1/status`)
}

bootstrap()
