module.exports = function (plop) {
  // Helper for converting to PascalCase
  plop.setHelper('pascalCase', (text) => {
    return text
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^\w/, (c) => c.toUpperCase())
  })

  // Helper for converting to camelCase
  plop.setHelper('camelCase', (text) => {
    return text
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^\w/, (c) => c.toLowerCase())
  })

  // Module generator - creates a complete NestJS module with controller and service
  plop.setGenerator('module', {
    description: 'Create a new NestJS module with controller and service',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Module name (e.g., "tasks" or "notifications"):',
        validate: (value) => {
          if (!value) return 'Module name is required'
          if (!/^[a-z][a-z0-9-]*$/.test(value)) {
            return 'Module name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens'
          }
          return true
        },
      },
      {
        type: 'input',
        name: 'prismaModel',
        message: 'Prisma model name (PascalCase, e.g., "Task" or "Notification"):',
        validate: (value) => {
          if (!value) return 'Prisma model name is required'
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
            return 'Prisma model name must be PascalCase'
          }
          return true
        },
      },
      {
        type: 'confirm',
        name: 'withAuth',
        message: 'Include authentication (CurrentUser decorator)?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'withCrud',
        message: 'Generate CRUD operations?',
        default: true,
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/{{name}}/{{name}}.module.ts',
        templateFile: 'plop-templates/module/module.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/{{name}}/{{name}}.controller.ts',
        templateFile: 'plop-templates/module/controller.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/{{name}}/{{name}}.service.ts',
        templateFile: 'plop-templates/module/service.ts.hbs',
      },
      {
        type: 'append',
        path: 'src/app.module.ts',
        pattern: /(import.*Module.*from.*\n)(?!.*import)/,
        template: "import { {{pascalCase name}}Module } from './{{name}}/{{name}}.module'\n",
      },
      {
        type: 'append',
        path: 'src/app.module.ts',
        pattern: /imports:\s*\[/,
        template: '\n    {{pascalCase name}}Module,',
      },
    ],
  })

  // Service-only generator
  plop.setGenerator('service', {
    description: 'Create a standalone NestJS service',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Service name (e.g., "email" or "cache"):',
        validate: (value) => {
          if (!value) return 'Service name is required'
          if (!/^[a-z][a-z0-9-]*$/.test(value)) {
            return 'Service name must be lowercase'
          }
          return true
        },
      },
      {
        type: 'input',
        name: 'modulePath',
        message: 'Module path to add service to (e.g., "users" or leave empty for new module):',
      },
    ],
    actions: (data) => {
      const actions = []

      if (data.modulePath) {
        // Add to existing module
        actions.push({
          type: 'add',
          path: 'src/{{modulePath}}/{{name}}.service.ts',
          templateFile: 'plop-templates/module/standalone-service.ts.hbs',
        })
      } else {
        // Create new module with just the service
        actions.push({
          type: 'add',
          path: 'src/{{name}}/{{name}}.module.ts',
          templateFile: 'plop-templates/module/service-module.ts.hbs',
        })
        actions.push({
          type: 'add',
          path: 'src/{{name}}/{{name}}.service.ts',
          templateFile: 'plop-templates/module/standalone-service.ts.hbs',
        })
      }

      return actions
    },
  })

  // Controller-only generator
  plop.setGenerator('controller', {
    description: 'Create a standalone NestJS controller',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Controller name (e.g., "health" or "webhooks"):',
        validate: (value) => {
          if (!value) return 'Controller name is required'
          if (!/^[a-z][a-z0-9-]*$/.test(value)) {
            return 'Controller name must be lowercase'
          }
          return true
        },
      },
      {
        type: 'input',
        name: 'route',
        message: 'Route path (e.g., "health" or "api/webhooks"):',
        default: (data) => data.name,
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/{{name}}/{{name}}.controller.ts',
        templateFile: 'plop-templates/module/standalone-controller.ts.hbs',
      },
    ],
  })
}
