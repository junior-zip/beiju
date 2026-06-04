// application/builders/SelectBuilder.ts
import type { IBuilder } from './IBuilder.js' 
import { SelectQuery } from '../../model/clause/SelectQuery.js'
import { SelectFn } from '../../../application/builders/SelectBuilder.js'
import { WhereFn } from '../../../application/builders/SelectBuilder.js'

export interface ISelectBuilder extends IBuilder<SelectQuery> {
  from(table: string, alias?: string): this
  select(fn: SelectFn): this
  where(fn: WhereFn): this
  groupBy(...columns: string[]): this
  orderBy(column: string, direction?: 'ASC' | 'DESC'): this
  limit(n: number): this
  offset(n: number): this
  fetch<T extends Record<string, any> = any>(): Promise<T[]>;
}