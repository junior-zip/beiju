import type { IQueryExecutor } from '../../domain/interfaces/IQueryExecutor.js'
import { SelectionItemType } from '../../domain/types/SelectionItemType.js'
import { ColumnRef } from '../../domain/model/ColumnRef.js'
import { SelectQuery } from '../../domain/model/clause/SelectQuery.js'
import { WhereClause } from '../../domain/model/clause/WhereClause.js'
import { WhereCondition } from '../../domain/model/clause/WhereCondition.js'
import { OrderByItem } from '../../domain/model/OrderByItem.js'
import { SqlGenerator } from '../../codegen/SqlGenerator.js'
import { WindowFnExprBuilder } from './WindowFnExprBuilder.js'
import { AggExprBuilder } from './AggExprBuilder.js'
import {ColumnContext, BuildableSelectionItem } from '../ColumnContext.js'
import { WhereContext } from '../WhereContext.js'
import { ISelectBuilder } from '../../domain/interfaces/ISelectBuilder.js'

export type SelectFn = (c: ColumnContext) => BuildableSelectionItem[]
export type WhereFn  = (c: WhereContext) => WhereCondition | WhereCondition[] | WhereClause

export class SelectBuilder implements ISelectBuilder {
  private fromClause?: { table: string; alias?: string }
  private selections: SelectionItemType[] = [];
  private whereClause?: WhereClause
  private groupByColumns: ColumnRef[] = []
  private orderByItems: OrderByItem[] = []
  private limitValue?: number
  private offsetValue?: number
  
  constructor(private readonly executor: IQueryExecutor) {}

  from(table: string, alias?: string): this {
    this.fromClause = { table, alias }
    return this
  }

  select(fn: SelectFn): this {
    const items = fn(new ColumnContext())

    // Resolve builders para seus tipos concretos de domínio
    this.selections = items.map(item => {
      if (item instanceof AggExprBuilder)    return item.build()
      if (item instanceof WindowFnExprBuilder) return item.build()
      return item // ColumnRef direto
    })

    return this
  }

  where(fn: WhereFn): this {
    const result = fn(new WhereContext())

    if (result instanceof WhereClause) {
      this.whereClause = result
    } else if (Array.isArray(result)) {
      this.whereClause = new WhereClause(result, 'AND')
    } else {
      // Condição única — envolve automaticamente em WhereClause
      this.whereClause = new WhereClause([result], 'AND')
    }

    return this
  }

  groupBy(...columns: string[]): this {
    this.groupByColumns = columns.map(col => new ColumnRef(col, 'string'))
    return this
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByItems.push(
      new OrderByItem(new ColumnRef(column, 'string'), direction)
    )
    return this
  }

  limit(n: number): this {
    this.limitValue = n
    return this
  }

  offset(n: number): this {
    this.offsetValue = n
    return this
  }

  build(): SelectQuery {
    if (!this.fromClause) {
      throw new Error('SelectBuilder: .from() é obrigatório')
    }
    if (this.selections.length === 0) {
      throw new Error('SelectBuilder: .select() é obrigatório')
    }

    return new SelectQuery(
      this.fromClause,
      this.selections,
      this.whereClause,
      this.groupByColumns.length > 0 ? this.groupByColumns : undefined,
      this.orderByItems.length > 0 ? this.orderByItems : undefined,
      this.limitValue,
      this.offsetValue,
    )
  }

  async fetch<T>(): Promise<T[]> {
    const query = this.build()
    const { sql, params } = SqlGenerator.compile(query)
    const result = await this.executor.execute<T>(sql, params)
    return result.rows
  }
}