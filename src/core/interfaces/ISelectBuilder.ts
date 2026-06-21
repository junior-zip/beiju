import type { IBuilder } from './IBuilder.js' 
import { SelectQuery } from '../ast/clause/SelectQuery.js' 
import { SelectFn } from '@builders/relational/SelectBuilder.js' 
import { WhereFn } from '@builders/relational/SelectBuilder.js' 

export interface ISelectBuilder extends IBuilder<SelectQuery> {
  from(table: string, alias?: string): this
  select(fn: SelectFn): this
  where(fn: WhereFn): this
  groupBy(...columns: string[]): this
  orderBy(column: string, direction?: 'ASC' | 'DESC'): this
  limit(n: number): this
  offset(n: number): this
  fetch<T extends Record<string, any> = any>(): Promise<T[]>;
  selecione(fn: SelectFn): this
}