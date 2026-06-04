import type { IBuilder } from './IBuilder.js'
import { WhereClause } from '../../model/clause/WhereClause.js'
import { WhereCondition } from '../../model/clause/WhereCondition.js'

export interface IWhereBuilder extends IBuilder<WhereClause> {
  and(...conditions: WhereCondition[]): this
  or(...conditions: WhereCondition[]): this
}