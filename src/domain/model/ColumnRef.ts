export type SqlType = 'number' | 'string' | 'date' | 'boolean'

export class ColumnRef<T extends SqlType = SqlType> {
  readonly kind = 'ColumnRef' as const
  
  constructor(
    readonly column: string,
    readonly type: T,
    readonly table?: string
  ){}

  public toSql(): string {
    return this.table ? `${this.table}.${this.column}` : this.column
  }

}
