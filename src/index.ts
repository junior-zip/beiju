export { AnalyticsContext } from './semantic/AnalyticsContext.js'
export { createTable } from './semantic/Table.js'
export { TypedColumn } from './semantic/TypedColumn.js'
export { RawSql } from './core/decorators/RawSql.js'
import { WindowFnExprBuilder } from './builders/relational/WindowFnExprBuilder.js';
import { ColumnRef } from '@core/ColumnRef.js'; 
import { AggExprBuilder } from '@builders/relational/AggExprBuilder.js';
import { TypedColumn } from './semantic/TypedColumn.js';

export const lag = (col: string | AggExprBuilder, offset = 1) => {
    const columnExpr = col instanceof AggExprBuilder
        ? col.build()                       
        : new ColumnRef(col, 'number') 

    return new WindowFnExprBuilder('LAG', columnExpr, offset);
}
export const rank = () => {
  return new WindowFnExprBuilder('RANK');
}
export const denseRank = () => {
  return new WindowFnExprBuilder('DENSE_RANK');
}
export const rowNumber = () => {
  return new WindowFnExprBuilder('ROW_NUMBER');
}
export const lead = (col: string, offset = 1) => {
  return new WindowFnExprBuilder('LEAD', new ColumnRef(col, 'number'), offset);
};

export const avg = (col: string | TypedColumn | AggExprBuilder) => {
  if (col instanceof AggExprBuilder) {

    return new AggExprBuilder('AVG', col.build() as any)
  }
  if (col instanceof TypedColumn) {

    return new AggExprBuilder('AVG', col.ref)
  }

  return new AggExprBuilder('AVG', new ColumnRef(col, 'number'))
}
export { PgAdapter }from './infrastructure/adapters/PgAdapter.js'

export type { IQueryExecutor } from './core/interfaces/IQueryExecutor.js'
export type { IQueryResult }   from './core/interfaces/IQueryExecutor.js'
export type { IRawQueryCheck } from './core/interfaces/IRawQueryCheck.js'