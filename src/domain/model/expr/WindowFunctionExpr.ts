import { ColumnRef} from '../ColumnRef.js'
import { SqlType } from '../../types/SqlType.js'
import { WindowSpec } from '../WindowSpec.js'
import { WindowFnType } from '../../types/WindowFnType.js'

export class WindowFunctionExpr<T extends SqlType = SqlType> {
  readonly kind = 'WindowFunctionExpr' as const

  constructor(
    readonly fn: WindowFnType,
    readonly window: WindowSpec,
    readonly column?: ColumnRef<T>,
    readonly offset?: number,
    readonly alias?: string,
  ) {}
}