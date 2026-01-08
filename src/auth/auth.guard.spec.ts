import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PokeAuthGuard } from './auth.guard'
import { IS_PUBLIC_KEY } from './public.decorator'

describe('PokeAuthGuard', () => {
  let guard: PokeAuthGuard
  let reflector: Reflector

  beforeEach(() => {
    reflector = new Reflector()
    guard = new PokeAuthGuard(reflector)
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })

  describe('canActivate', () => {
    const createMockExecutionContext = (): ExecutionContext => {
      return {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({}),
        }),
        getType: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
      } as unknown as ExecutionContext
    }

    it('should return true for public routes', () => {
      const context = createMockExecutionContext()
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true)

      const result = guard.canActivate(context)

      expect(result).toBe(true)
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    })

    it('should call parent canActivate for non-public routes', () => {
      const context = createMockExecutionContext()
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)

      // Mock the parent class canActivate
      const parentCanActivate = jest
        .spyOn(Object.getPrototypeOf(PokeAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true)

      const result = guard.canActivate(context)

      expect(result).toBe(true)
      expect(parentCanActivate).toHaveBeenCalledWith(context)

      parentCanActivate.mockRestore()
    })

    it('should call parent canActivate when isPublic is undefined', () => {
      const context = createMockExecutionContext()
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined)

      const parentCanActivate = jest
        .spyOn(Object.getPrototypeOf(PokeAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true)

      const result = guard.canActivate(context)

      expect(result).toBe(true)
      expect(parentCanActivate).toHaveBeenCalled()

      parentCanActivate.mockRestore()
    })
  })
})
