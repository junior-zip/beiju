import { WindowSpec } from "@core/ast/WindowSpec.js"
import { AggregateExpr } from "@core/ast/expr/AggregateExpr.js" 
import { AggFnType } from "@core/types/AggFnType.js"
import { ColumnRef } from "@core/ColumnRef.js" 
import { WindowBuilderFn, WindowBuilder } from "./WindowBuilder.js"

export type AggColumn = ColumnRef | AggregateExpr

export class AggExprBuilder {
  constructor(
    private readonly fn: AggFnType,
    private readonly column: AggColumn,
    private alias?: string,
    private windowSpec?: WindowSpec,
  ) {}

  as(alias: string): this {
    this.alias = alias;
    return this;
  }

  over(fn: WindowBuilderFn): this {
    const wb = new WindowBuilder();
    fn(wb);
    this.windowSpec = wb.build();
    return this;
  }

  // ─── Alias em português —
  como(alias: string): this {
    return this.as(alias);
  }

  sobre(fn: WindowBuilderFn): this {
    return this.over(fn);
  }

  build(): AggregateExpr {
    return new AggregateExpr(this.fn, this.column, this.alias, this.windowSpec);
  }
}
