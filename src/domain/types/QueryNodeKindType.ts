export type QueryNodeKindType =
  | 'SelectQuery'
  | 'ColumnRef'
  | 'AggregateExpr'
  | 'WindowSpec'
  | 'WindowFunctionExpr'
  | 'WhereClause'
  | 'OrderByItem'
  | 'FrameSpec'