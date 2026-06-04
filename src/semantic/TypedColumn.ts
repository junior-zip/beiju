import { ColumnRef } from '../domain/model/ColumnRef.js'
import { SqlType } from '../domain/types/SqlType.js'
import { AggExprBuilder } from '../application/builders/AggExprBuilder.js'
import { WindowFnExprBuilder } from '../application/builders/WindowFnExprBuilder.js'
import { WhereCondition } from '../domain/model/clause/WhereCondition.js'

/**
 * Representa uma coluna como cidadão de primeira classe na DSL.
 * Encapsula o ColumnRef e expõe métodos de agregação e condição
 * diretamente na coluna — sem precisar de strings.
 *
 * Em vez de: c.col('seller_name', 'o')
 * Você usa:  orders.seller_name
 */
export class TypedColumn<T extends SqlType = SqlType> {
  readonly ref: ColumnRef<T>

  constructor(
    readonly name: string,
    readonly type: T,
    readonly table?: string,
  ) {
    this.ref = new ColumnRef(name, type, table)
  }

  // Alias visual — não muda o SQL, só documenta a intenção
  as(alias: string): AliasedColumn<T> {
    return new AliasedColumn(this.name, this.type, alias, this.table)
  }

  // Agregações — disponíveis diretamente na coluna
  sum(): AggExprBuilder  { return new AggExprBuilder('SUM', this.ref) }
  avg(): AggExprBuilder  { return new AggExprBuilder('AVG', this.ref) }
  count(): AggExprBuilder { return new AggExprBuilder('COUNT', this.ref) }
  min(): AggExprBuilder  { return new AggExprBuilder('MIN', this.ref) }
  max(): AggExprBuilder  { return new AggExprBuilder('MAX', this.ref) }

  // Condições WHERE — direto na coluna
  eq(value: unknown): WhereCondition    { return new WhereCondition(this.ref, '=', value) }
  neq(value: unknown): WhereCondition   { return new WhereCondition(this.ref, '!=', value) }
  gt(value: unknown): WhereCondition    { return new WhereCondition(this.ref, '>', value) }
  lt(value: unknown): WhereCondition    { return new WhereCondition(this.ref, '<', value) }
  gte(value: unknown): WhereCondition   { return new WhereCondition(this.ref, '>=', value) }
  lte(value: unknown): WhereCondition   { return new WhereCondition(this.ref, '<=', value) }
  between(a: unknown, b: unknown): WhereCondition {
    return new WhereCondition(this.ref, 'BETWEEN', [a, b])
  }
  in(values: unknown[]): WhereCondition {
    return new WhereCondition(this.ref, 'IN', values)
  }
}

export class AliasedColumn<T extends SqlType = SqlType> extends TypedColumn<T> {
  constructor(
    name: string,
    type: T,
    readonly alias: string,
    table?: string,
  ) {
    super(name, type, table)
  }
}