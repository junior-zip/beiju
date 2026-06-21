import { JoinBuilder } from "@builders/relational/JoinBuilder.js"
import { Table } from "@semantic/Table.js"
import { SelectQuery } from "@core/ast/clause/SelectQuery.js"

/**
 * Contrato mínimo do SemanticSelectBuilder.
 * Usado como tipo de retorno da SelectBuilderFactory em Table.ts
 * para evitar importação circular de SemanticSelectBuilder.
 */
export interface ISemanticSelectBuilder {
  fetch<T>(): Promise<T[]>
  build(): SelectQuery 
  where(input: unknown): this
  groupBy(...columns: unknown[]): this
  orderBy(column: unknown, direction?: 'ASC' | 'DESC'): this
  limit(n: number): this
  offset(n: number): this
  join(table: Table): JoinBuilder<this>
  innerJoin(table: Table): JoinBuilder<this>
  leftJoin(table: Table): JoinBuilder<this>
  rightJoin(table: Table): JoinBuilder<this>
}