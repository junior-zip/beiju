import { ColumnRef } from '@core/ColumnRef.js'
import { WindowFunctionExpr } from '@core/ast/expr/WindowFunctionExpr.js' 
import { WindowFnType } from '@core/types/WindowFnType.js' 
import { WindowSpec } from '@core/ast/WindowSpec.js' 
import { WindowBuilder } from './WindowBuilder.js'
import { WindowBuilderFn } from './WindowBuilder.js'
import { WindowFnColumn } from '@core/ast/expr/WindowFunctionExpr.js'

export class WindowFnExprBuilder {
  private alias?: string
  private windowSpec?: WindowSpec

  constructor(
    private readonly fn: WindowFnType,
    private readonly column?: WindowFnColumn,
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

  // ─── Alias em português — em ambas as classes ─────────────────────────────
  como(alias: string): this {
    return this.as(alias)
  }

  // (em WindowFnExprBuilder também)
  sobre(fn: WindowBuilderFn): this {
    return this.over(fn)
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