import { ColumnRef } from '../../domain/model/ColumnRef.js'
import { WindowFunctionExpr } from '../../domain/model/expr/WindowFunctionExpr.js'
import { WindowFnType } from '../../domain/types/WindowFnType.js'
import { WindowSpec } from '../../domain/model/WindowSpec.js'
import { WindowBuilder } from './WindowBuilder.js'
import { WindowBuilderFn } from './WindowBuilder.js'

export class WindowFnExprBuilder {
  private alias?: string
  private windowSpec?: WindowSpec

  constructor(
    private readonly fn: WindowFnType,
    private readonly column?: ColumnRef,
    private readonly offset?: number,
  ) {}

  as(alias: string): this {
    this.alias = alias
    return this
  }

  over(fn: WindowBuilderFn): this {
    const wb = new WindowBuilder()
    fn(wb) 
    this.windowSpec = wb.build()
    return this
  }

  build(): WindowFunctionExpr {
    if (!this.windowSpec) {
      throw new Error(
        `Window Function "${this.fn}" requer uma cláusula .over(). ` +
        `Exemplo: c.${this.fn.toLowerCase()}().over(w => w.orderBy('coluna'))`
      )
    }
    return new WindowFunctionExpr(
      this.fn,
      this.windowSpec,
      this.column,
      this.offset,
      this.alias,
    )
  }
}