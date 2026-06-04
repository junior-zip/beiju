export interface QueryResult<T> {
  readonly rows: T[]
  readonly rowCount: number
}

export interface QueryExecutor {
  execute<T>(sql: string, params: unknown[]): Promise<QueryResult<T>>
  close(): Promise<void>
}