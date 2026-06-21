// domain/model/AggregateExpr.ts
import { ColumnRef } from '../../ColumnRef.js'
import { SqlType } from '../../types/SqlType.js' 
import { WindowSpec } from '../WindowSpec.js' 
import { AggFnType } from '../../types/AggFnType.js' 

export type AggColumn = ColumnRef | AggregateExpr

export class AggregateExpr<T extends SqlType = SqlType> {
  readonly kind = 'AggregateExpr' as const

  constructor(
    readonly fn: AggFnType,
    readonly column: AggColumn,
    readonly alias?: string,
    readonly window?: WindowSpec,
  ) {}
}
