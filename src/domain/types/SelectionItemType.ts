import { ColumnRef } from "../model/ColumnRef.js"
import { AggregateExpr } from "../model/expr/AggregateExpr.js"
import { WindowFunctionExpr } from "../model/expr/WindowFunctionExpr.js"

export type SelectionItemType = ColumnRef | AggregateExpr | WindowFunctionExpr
