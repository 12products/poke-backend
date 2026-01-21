import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { Logger, ValidationPipe } from '@nestjs/common'

import { AppModule } from './app.module'

const logger = new Logger('Bootstrap')

async function bootstrap() {
  const startTime = Date.now()

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV === 'development',
    })
  )

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  app.setGlobalPrefix('/v1')

  const port = process.env.PORT || 3000
  const host = process.env.HOST || '0.0.0.0'

  await app.listen(port, host)

  const bootTime = Date.now() - startTime
  logger.log(`Application started in ${bootTime}ms`)
  logger.log(`Application is running on: ${await app.getUrl()}`)
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
}

bootstrap().catch((error) => {
  logger.error('Failed to start application', error)
  process.exit(1)
})
