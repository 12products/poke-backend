import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { Logger } from '@nestjs/common'

import { AppModule } from './app.module'

const logger = new Logger('Bootstrap')

async function bootstrap() {
  const startTime = Date.now()

  logger.log('Starting Poke Backend...')

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV !== 'production',
    })
  )

  // CORS configuration
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['*']
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })

  app.setGlobalPrefix('/v1')

  // Graceful shutdown handlers
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT']
  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.warn(`Received ${signal}, starting graceful shutdown...`)
      await app.close()
      logger.log('Application shut down gracefully')
      process.exit(0)
    })
  })

  const port = process.env.PORT || 3000
  const host = process.env.HOST || '0.0.0.0'

  await app.listen(port, host)

  const duration = Date.now() - startTime
  logger.log(`Application started in ${duration}ms`)
  logger.log(`Server running at: ${await app.getUrl()}`)
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
}

bootstrap().catch((error) => {
  logger.error('Failed to start application', error)
  process.exit(1)
})
