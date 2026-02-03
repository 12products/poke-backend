// This is the main entry point for the Poke backend application
// It bootstraps the NestJS app using Fastify as the HTTP adapter
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'

// Import the root module
import { AppModule } from './app.module'

// Bootstrap function - this is where the magic happens
async function bootstrap() {
  // Create the NestJS application with Fastify adapter
  // Fastify is faster than Express, which is pretty cool
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  )
  // Todo: need to update origin once we deploy
  // CORS configuration - allowing all origins for now
  // This might need to be more restrictive in production
  app.enableCors({
    origin: '*', // wildcard allows everything
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // standard HTTP methods
  })

  // All routes will be prefixed with /v1
  // This helps with API versioning
  app.setGlobalPrefix('/v1')

  // Start listening on the configured port or default to 3000
  // The PORT env var is usually set by the hosting platform
  await app.listen(process.env.PORT || 3000)

  // Log the URL so we know where the app is running
  console.log(`Application is running on: ${await app.getUrl()}`)
}

// Call the bootstrap function to start everything up!
bootstrap()
