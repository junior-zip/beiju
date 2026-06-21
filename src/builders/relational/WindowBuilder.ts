import { ColumnRef } from '@core/ColumnRef.js' 
import { FrameSpec } from '@core/ast/FrameSpec.js' 
import { WindowSpec } from '@core/ast/WindowSpec.js' 
import { OrderByItem } from '@core/ast/OrderByItem.js' 
import { IWindowBuilder } from '@core/interfaces/IWindowBuilder.js' 
import { AggExprBuilder } from './AggExprBuilder.js' 
export type FrameBoundary = number | 'unbounded' | 'current'

export type WindowBuilderFn = (w: WindowBuilder) => WindowBuilder

export class WindowBuilder implements IWindowBuilder {
  private partitionByColumns: ColumnRef[] = []
  private orderByItems: OrderByItem[] = []
  private frameSpec?: FrameSpec

  partitionBy(...columns: string[]): this {
    this.partitionByColumns = columns.map(col => new ColumnRef(col, 'string'))
    return this
  }

  orderBy(column: string | AggExprBuilder, direction: 'ASC' | 'DESC' = 'ASC'): this {
    const expr = column instanceof AggExprBuilder
    ? column.build()                          // AggregateExpr
    : new ColumnRef(column, 'string')         // ColumnRef

  this.orderByItems.push(new OrderByItem(expr, direction))
  return this
  }

  rowsBetween(start: FrameBoundary, end: FrameBoundary): this {
    this.frameSpec = new FrameSpec('ROWS', start, end)
    return this
  }

  rangeBetween(start: FrameBoundary, end: FrameBoundary): this {
    this.frameSpec = new FrameSpec('RANGE', start, end)
    return this
  }

  build(): WindowSpec {
    return new WindowSpec(
      this.partitionByColumns,
      this.orderByItems,
      this.frameSpec,
    )
  }
}