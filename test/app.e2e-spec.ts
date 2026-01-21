import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from './../src/app.module'

describe('AppController (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    )
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Health Endpoints', () => {
    it('/ (GET) should return OK', () => {
      return request(app.getHttpServer()).get('/').expect(200).expect('OK')
    })

    it('/health (GET) should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'healthy')
          expect(res.body).toHaveProperty('timestamp')
          expect(res.body).toHaveProperty('uptime')
          expect(res.body).toHaveProperty('version')
          expect(res.body).toHaveProperty('environment')
        })
    })

    it('/stats (GET) should return system stats', () => {
      return request(app.getHttpServer())
        .get('/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('memoryUsage')
          expect(res.body).toHaveProperty('cpuUsage')
          expect(res.body).toHaveProperty('platform')
          expect(res.body).toHaveProperty('nodeVersion')
        })
    })

    it('/ping (GET) should return pong', () => {
      return request(app.getHttpServer())
        .get('/ping')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('pong', true)
          expect(res.body).toHaveProperty('time')
        })
    })
  })

  describe('Protected Endpoints', () => {
    it('/v1/users/me (GET) should require authentication', () => {
      return request(app.getHttpServer()).get('/v1/users/me').expect(401)
    })

    it('/v1/reminders (GET) should require authentication', () => {
      return request(app.getHttpServer()).get('/v1/reminders').expect(401)
    })
  })

  describe('Public Endpoints', () => {
    it('/v1/users/count (GET) should be publicly accessible', () => {
      return request(app.getHttpServer())
        .get('/v1/users/count')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('count')
          expect(typeof res.body.count).toBe('number')
        })
    })
  })
})
