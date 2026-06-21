import { JoinBuilder } from "@builders/relational/JoinBuilder.js"
import { Table } from "@semantic/Table.js"
import { SelectQuery } from "@core/ast/clause/SelectQuery.js"

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
  fullOuterJoin(table: Table): JoinBuilder<this> 
  onde(input: unknown): this
  agrupePor(...columns: unknown[]): this
  ordenePor(column: unknown, direction?: 'ASC' | 'DESC'): this
  limite(n: number): this
  offset(n: number): this
  juncaoInterna(table: Table): JoinBuilder<this>
  junte(table: Table): JoinBuilder<this>
  juncaoEsquerda(table: Table): JoinBuilder<this>
  juncaoDireita(table: Table): JoinBuilder<this>
  juncaoExterna(table: Table): JoinBuilder<this> 
  buscar()
}