import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'

import { AppModule } from './app.module'

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function animateTitle() {
  const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    bold: '\x1b[1m',
  }

  const frames = [
    `
${colors.cyan}╔═══════════════════════════╗
║                           ║
║                           ║
║                           ║
╚═══════════════════════════╝${colors.reset}
`,
    `
${colors.cyan}╔═══════════════════════════╗
║  ${colors.magenta}█▀█${colors.cyan}                    ║
║  ${colors.magenta}█▀▀${colors.cyan}                    ║
║  ${colors.magenta}▀${colors.cyan}                      ║
╚═══════════════════════════╝${colors.reset}
`,
    `
${colors.cyan}╔═══════════════════════════╗
║  ${colors.magenta}█▀█ █▀█${colors.cyan}                ║
║  ${colors.magenta}█▀▀ █▄█${colors.cyan}                ║
║  ${colors.magenta}▀   ▀${colors.cyan}                  ║
╚═══════════════════════════╝${colors.reset}
`,
    `
${colors.cyan}╔═══════════════════════════╗
║  ${colors.magenta}█▀█ █▀█ █▄▀${colors.cyan}            ║
║  ${colors.magenta}█▀▀ █▄█ █${colors.cyan} █            ║
║  ${colors.magenta}▀   ▀   ▀${colors.cyan} ▀            ║
╚═══════════════════════════╝${colors.reset}
`,
    `
${colors.cyan}╔═══════════════════════════╗
║  ${colors.magenta}█▀█ █▀█ █▄▀ █▀▀${colors.cyan}        ║
║  ${colors.magenta}█▀▀ █▄█ █${colors.cyan} █ ${colors.magenta}█▀▀${colors.cyan}        ║
║  ${colors.magenta}▀   ▀   ▀${colors.cyan} ▀ ${colors.magenta}▀▀▀${colors.cyan}        ║
╚═══════════════════════════╝${colors.reset}
`,
    `
${colors.cyan}╔═══════════════════════════╗
║  ${colors.bold}${colors.magenta}█▀█ █▀█ █▄▀ █▀▀${colors.reset}${colors.cyan}        ║
║  ${colors.bold}${colors.magenta}█▀▀ █▄█ █${colors.reset}${colors.cyan} █ ${colors.bold}${colors.magenta}█▀▀${colors.reset}${colors.cyan}        ║
║  ${colors.bold}${colors.magenta}▀   ▀   ▀${colors.reset}${colors.cyan} ▀ ${colors.bold}${colors.magenta}▀▀▀${colors.reset}${colors.cyan}        ║
║                           ║
║  ${colors.yellow}⚡ Accountability System${colors.cyan}  ║
╚═══════════════════════════╝${colors.reset}
`,
  ]

  // Clear console
  console.clear()

  // Animate frames
  for (const frame of frames) {
    console.clear()
    console.log(frame)
    await sleep(200)
  }

  // Final animated flourish
  await sleep(300)
  console.clear()
  console.log(`
${colors.cyan}╔═══════════════════════════╗
║  ${colors.bold}${colors.green}█▀█ █▀█ █▄▀ █▀▀${colors.reset}${colors.cyan}        ║
║  ${colors.bold}${colors.green}█▀▀ █▄█ █${colors.reset}${colors.cyan} █ ${colors.bold}${colors.green}█▀▀${colors.reset}${colors.cyan}        ║
║  ${colors.bold}${colors.green}▀   ▀   ▀${colors.reset}${colors.cyan} ▀ ${colors.bold}${colors.green}▀▀▀${colors.reset}${colors.cyan}        ║
║                           ║
║  ${colors.yellow}⚡ Accountability System${colors.cyan}  ║
╚═══════════════════════════╝${colors.reset}
`)
}

async function bootstrap() {
  await animateTitle()

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

  await app.listen(process.env.PORT || 3000)

  console.log(`\n${await app.getUrl()} ${'\x1b[32m'}✓${'\x1b[0m'}\n`)
}

bootstrap()
