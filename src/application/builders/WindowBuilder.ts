import { ColumnRef } from '../../domain/model/ColumnRef.js'
import { FrameSpec } from '../../domain/model/FrameSpec.js'
import { WindowSpec } from '../../domain/model/WindowSpec.js'
import { OrderByItem } from '../../domain/model/OrderByItem.js'
import { IWindowBuilder } from '../../domain/interfaces/builder/IWindowBuilder.js'
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

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByItems.push(
      new OrderByItem(new ColumnRef(column, 'string'), direction)
    )
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