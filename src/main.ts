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
  const corsOrigin = process.env.CORS_ORIGIN || '*'
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  })

  app.setGlobalPrefix('/v1')

  await app.listen(process.env.PORT || 3000)

  console.log(`Application is running on: ${await app.getUrl()}`)
}

bootstrap()
