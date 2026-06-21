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