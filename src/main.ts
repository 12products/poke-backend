import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { Logger, ValidationPipe } from '@nestjs/common'

import { AppModule } from './app.module'
import { APP_NAME, APP_VERSION } from './constants'

const logger = new Logger('Bootstrap')

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV !== 'production',
    })
  )

  // Global validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  // API versioning
  app.setGlobalPrefix('/v1')

  const port = process.env.PORT || 3000
  const host = process.env.HOST || '0.0.0.0'

  await app.listen(port, host)

  logger.log(`${APP_NAME} v${APP_VERSION}`)
  logger.log(`Server running on: ${await app.getUrl()}`)
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
}

bootstrap().catch((error) => {
  logger.error('Failed to start application', error)
  process.exit(1)
})
