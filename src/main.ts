import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { Logger, ValidationPipe } from '@nestjs/common'

import { AppModule } from './app.module'
import { DatabaseService } from './database/database.service'

const logger = new Logger('Bootstrap')

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV === 'development',
    })
  )

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  )

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })

  app.setGlobalPrefix('/v1')

  const databaseService = app.get(DatabaseService)
  await databaseService.enableShutdownHooks(app)

  const port = process.env.PORT || 3000
  const host = process.env.HOST || '0.0.0.0'

  await app.listen(port, host)

  const url = await app.getUrl()
  logger.log(`Application is running on: ${url}`)
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.log(`API prefix: /v1`)

  if (process.env.NODE_ENV === 'development') {
    logger.debug('Development mode enabled')
  }
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`)
})

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`)
  process.exit(1)
})

bootstrap().catch((error) => {
  logger.error(`Failed to start application: ${error.message}`)
  process.exit(1)
})
