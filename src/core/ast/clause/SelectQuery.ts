import { ColumnRef } from '../../ColumnRef.js'; 
import { WhereClause } from './WhereClause.js'
import { OrderByItem } from '../OrderByItem.js';
import { SelectionItemType } from '../../types/SelectionItemType.js';
import { JoinSpec } from '../JoinSpec.js';

export class SelectQuery {
  constructor(
    readonly from: { table: string; alias?: string },
    readonly select: SelectionItemType[],
    readonly where?: WhereClause,
    readonly joins?:  JoinSpec[], 
    readonly groupBy?: ColumnRef[],
    readonly orderBy?: OrderByItem[],
    readonly limit?: number,
    readonly offset?: number,
  ) {}
}