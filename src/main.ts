// This is where the magic begins
// Welcome to the poke-backend, where dreams come true
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'

import { AppModule } from './app.module'

// Bootstrap: not a CSS framework, but close enough
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

  // v1 because we're optimists about v2
  app.setGlobalPrefix('/v1')

  await app.listen(process.env.PORT || 3000)

  console.log(`Application is running on: ${await app.getUrl()}`)
}

bootstrap()
