import { WhereCondition } from './WhereCondition.js'

export class WhereClause {
  constructor(
    readonly conditions: WhereCondition[],
    readonly operator: 'AND' | 'OR' = 'AND',
  ) {}  

}

export function or(...conditions: WhereCondition[]): WhereClause {
  if (conditions.length === 0) {
    throw new Error('or(): Pelo menos uma condição é necessária')
  }
  return new WhereClause(conditions, 'OR')
}

export function and(...conditions: WhereCondition[]): WhereClause {
  if (conditions.length === 0) {
    throw new Error('and(): ao menos uma condição é necessária')
  }
  return new WhereClause(conditions, 'AND')
}