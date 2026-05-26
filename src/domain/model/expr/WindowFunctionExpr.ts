import { ColumnRef, SqlType } from '../ColumnRef.js'
import { WindowSpec } from '../WindowSpec.js'

export type WindowFn = 'ROW_NUMBER' | 'RANK' | 'DENSE_RANK' | 'LAG' | 'LEAD' | 'NTILE'

export class WindowFunctionExpr<T extends SqlType = SqlType> {
  readonly kind = 'WindowFunctionExpr' as const

  constructor(
    readonly fn: WindowFn,
    readonly window: WindowSpec,
    readonly column?: ColumnRef<T>,
    readonly offset?: number,
    readonly alias?: string,
  ) {}
}