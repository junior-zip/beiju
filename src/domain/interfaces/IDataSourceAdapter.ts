import type { IQueryExecutor } from './IQueryExecutor.js'

export interface ColumnSchema {
  name: string
  type: 'number' | 'string' | 'date' | 'boolean'
  nullable?: boolean
}

export interface TableSchema {
  tableName: string
  columns: ColumnSchema[]
}

export interface IDataSourceAdapter extends IQueryExecutor {
  introspect(tableName: string): Promise<TableSchema>
}