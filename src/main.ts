// Main entry point for the Poke backend application
// This file bootstraps the NestJS application with Fastify
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'

// Import the root application module
import { AppModule } from './app.module'

// Bootstrap function to initialize and start the server
async function bootstrap() {
  // Create the NestJS application instance using Fastify adapter
  // Fastify was chosen for better performance over Express
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  )
  // Todo: need to update origin once we deploy
  // Enable CORS for cross-origin requests
  // Currently allowing all origins - should be restricted in production
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  })

  // Set global API prefix for versioning
  // All routes will be prefixed with /v1
  app.setGlobalPrefix('/v1')

  // Start listening on configured port or default to 3000
  // The PORT environment variable should be set in production
  await app.listen(process.env.PORT || 3000)

  // Log the running URL for debugging purposes
  console.log(`Application is running on: ${await app.getUrl()}`)
}

// Invoke the bootstrap function to start everything
bootstrap()
