import { ColumnRef } from "../ColumnRef.js" 
import { AggregateExpr } from "./expr/AggregateExpr.js"

export type OrderByExpr = ColumnRef | AggregateExpr

export class OrderByItem {
  readonly kind = 'OrderByItem' as const

  constructor(
    readonly expr: OrderByExpr,
    readonly direction: 'ASC' | 'DESC' = 'ASC'
  ) {}
}

export function resolveOrderByExpr(
  column: { ref: ColumnRef } | { build: () => AggregateExpr },
): OrderByExpr {
  if ('build' in column && typeof column.build === 'function') {
    return column.build()
  }
  return (column as { ref: ColumnRef }).ref
}