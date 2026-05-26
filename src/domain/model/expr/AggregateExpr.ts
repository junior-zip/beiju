// domain/model/AggregateExpr.ts
import { ColumnRef, SqlType } from '../ColumnRef.js'
import { WindowSpec } from '../WindowSpec.js'

export type AggFn = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX'

export class AggregateExpr<T extends SqlType = SqlType> {
  readonly kind = 'AggregateExpr' as const

  constructor(
    readonly fn: AggFn,
    readonly column: ColumnRef<T>,
    readonly alias?: string,
    readonly window?: WindowSpec,
  ) {}
}
