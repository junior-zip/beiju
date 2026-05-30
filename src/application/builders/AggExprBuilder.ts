import { WindowSpec } from "../../domain/model/WindowSpec.js"
import { AggregateExpr } from "../../domain/model/expr/AggregateExpr.js"
import { AggFnType } from "../../domain/types/AggFnType.js"
import { ColumnRef } from "../../domain/model/ColumnRef.js"
import { WindowBuilderFn, WindowBuilder } from "./WindowBuilder.js"

export class AggExprBuilder {
  private alias?: string
  private windowSpec?: WindowSpec

  constructor(
    private readonly fn: AggFnType,
    private readonly column: ColumnRef,
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

  build(): AggregateExpr {
    return new AggregateExpr(this.fn, this.column, this.alias, this.windowSpec)
  }
}