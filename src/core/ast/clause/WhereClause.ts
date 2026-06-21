import { WhereCondition } from './WhereCondition.js'

export class WhereClause {
  constructor(
    readonly conditions: WhereCondition[],
    readonly operator: 'AND' | 'OR' = 'AND',
  ) {}  

}


//As soluções abaixo são provisórias e serão melhoradas com implementações com mais níveis de aninhamento em trabalahos futuros!
/**
 * Helper para combinar condições com OR.
 * Exemplo: .where(or(vendas.vendedor_id.eq(1), vendas.vendedor_id.eq(2)))
 */
export function or(...conditions: WhereCondition[]): WhereClause {
  if (conditions.length === 0) {
    throw new Error('or(): Pelo menos uma condição é necessária')
  }
  return new WhereClause(conditions, 'OR')
}


/**
 * Helper para combinar condições com AND.
 * Equivalente a passar um array direto no .where(), mas explícito.
 */
export function and(...conditions: WhereCondition[]): WhereClause {
  if (conditions.length === 0) {
    throw new Error('and(): ao menos uma condição é necessária')
  }
  return new WhereClause(conditions, 'AND')
}