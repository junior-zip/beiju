import { ColumnRef } from '../domain/model/ColumnRef.js'
import { SqlType } from '../domain/types/SqlType.js'
import { AggFnType } from '../domain/types/AggFnType.js'
import { AggExprBuilder } from './builders/AggExprBuilder.js'
import { WindowFnExprBuilder } from './builders/WindowFnExprBuilder.js'

export class ColumnContext {

  col(name: string, table?: string): ColumnRef {
    return new ColumnRef(name, 'string', table)
  }

  // --- Agregações ---

  private agg(fn: AggFnType, column: string, type: SqlType = 'number'): AggExprBuilder {
    return new AggExprBuilder(fn, new ColumnRef(column, type))
  }

  sum(column: string): AggExprBuilder    { return this.agg('SUM', column) }
  avg(column: string): AggExprBuilder    { return this.agg('AVG', column) }
  count(column: string): AggExprBuilder  { return this.agg('COUNT', column) }
  min(column: string): AggExprBuilder    { return this.agg('MIN', column) }
  max(column: string): AggExprBuilder    { return this.agg('MAX', column) }

  // --- Window Functions ---

  rank(): WindowFnExprBuilder {
    return new WindowFnExprBuilder('RANK')
  }

  denseRank(): WindowFnExprBuilder {
    return new WindowFnExprBuilder('DENSE_RANK')
  }

  rowNumber(): WindowFnExprBuilder {
    return new WindowFnExprBuilder('ROW_NUMBER')
  }

  lag(column: string, offset: number = 1): WindowFnExprBuilder {
    return new WindowFnExprBuilder('LAG', new ColumnRef(column, 'number'), offset)
  }

  lead(column: string, offset: number = 1): WindowFnExprBuilder {
    return new WindowFnExprBuilder('LEAD', new ColumnRef(column, 'number'), offset)
  }

  ntile(n: number): WindowFnExprBuilder {
    return new WindowFnExprBuilder('NTILE', new ColumnRef(String(n), 'number'))
  }
}

// Tipo utilitário — aceita ColumnRef, AggExprBuilder ou WindowFnExprBuilder
export type BuildableSelectionItem = ColumnRef | AggExprBuilder | WindowFnExprBuilder