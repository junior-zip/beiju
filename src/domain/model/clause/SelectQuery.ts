// domain/model/SelectQuery.ts
import { ColumnRef } from '../ColumnRef.js'
import { WhereClause } from './WhereClause.js'
import { OrderByItem } from '../OrderByItem.js' 
import { SelectionItemType } from '../../types/SelectionItemType.js';

export class SelectQuery {
  constructor(
    readonly from: { table: string; alias?: string },
    readonly select: SelectionItemType[],
    readonly where?: WhereClause,
    readonly groupBy?: ColumnRef[],
    readonly orderBy?: OrderByItem[],
    readonly limit?: number,
    readonly offset?: number,
  ) {}
}