export class PaginationDto {
  page?: number = 1
  limit?: number = 10
  sortBy?: string = 'createdAt'
  sortOrder?: 'asc' | 'desc' = 'desc'
}

export class PaginatedResponseDto<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data
    const totalPages = Math.ceil(total / limit)
    this.meta = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  }
}

export interface CursorPaginationDto {
  cursor?: string
  limit?: number
  direction?: 'forward' | 'backward'
}

export interface CursorPaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
  previousCursor: string | null
  hasMore: boolean
}
