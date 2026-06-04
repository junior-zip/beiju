export interface IQueryResult<T> {
  readonly rows: T[]
  readonly rowCount: number
}

export interface IQueryExecutor {
  execute<T extends Record<string, any> = any>(
    sql: string, 
    params: unknown[]
  ): Promise<IQueryResult<T>>;
  close(): Promise<void>
}