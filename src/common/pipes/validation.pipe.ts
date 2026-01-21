import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common'

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string> {
  private readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  transform(value: string, metadata: ArgumentMetadata): string {
    if (!this.uuidRegex.test(value)) {
      throw new BadRequestException(
        `${metadata.data || 'Parameter'} must be a valid UUID`
      )
    }
    return value
  }
}

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const parsed = parseInt(value, 10)

    if (isNaN(parsed) || parsed < 0) {
      throw new BadRequestException(
        `${metadata.data || 'Parameter'} must be a positive integer`
      )
    }

    return parsed
  }
}

@Injectable()
export class ParseBooleanPipe implements PipeTransform<string, boolean> {
  transform(value: string): boolean {
    if (value === 'true' || value === '1') return true
    if (value === 'false' || value === '0') return false
    throw new BadRequestException('Value must be a boolean')
  }
}

@Injectable()
export class TrimPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (typeof value !== 'string') return value
    return value.trim()
  }
}

@Injectable()
export class ParseArrayPipe implements PipeTransform<string, string[]> {
  constructor(private readonly separator: string = ',') {}

  transform(value: string): string[] {
    if (!value) return []
    return value.split(this.separator).map((item) => item.trim())
  }
}

@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date> {
  transform(value: string, metadata: ArgumentMetadata): Date {
    const date = new Date(value)

    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        `${metadata.data || 'Parameter'} must be a valid date`
      )
    }

    return date
  }
}

@Injectable()
export class SanitizeHtmlPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (typeof value !== 'string') return value
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }
}
