import { ColumnRef } from '../core/ColumnRef.js' 
import { SqlType } from '../core/types/SqlType.js'
import { AggExprBuilder } from '@builders/relational/AggExprBuilder.js' 
import { WindowFnExprBuilder } from '@builders/relational/WindowFnExprBuilder.js'
import { WhereCondition } from '../core/ast/clause/WhereCondition.js' 

/**
 * Representa uma coluna como cidadão de primeira classe na DSL.
 * Encapsula o ColumnRef e expõe métodos de agregação e condição
 * diretamente na coluna — sem precisar de strings.
 *
 * Em vez de: c.col('seller_name', 'o')
 * Você usa:  orders.seller_name
 */

export class TypedColumn<T extends SqlType = SqlType> {
  readonly ref: ColumnRef<T>;

  constructor(
    readonly name: string,
    readonly type: T,
    readonly table?: string,
  ) {
    this.ref = new ColumnRef(name, type, table);
  }

  as(alias: string): AliasedColumn<T> {
    return new AliasedColumn(this.name, this.type, alias, this.table);
  }

  sum(): AggExprBuilder {
    return new AggExprBuilder("SUM", this.ref);
  }
  avg(): AggExprBuilder {
    return new AggExprBuilder("AVG", this.ref);
  }
  count(): AggExprBuilder {
    return new AggExprBuilder("COUNT", this.ref);
  }
  min(): AggExprBuilder {
    return new AggExprBuilder("MIN", this.ref);
  }
  max(): AggExprBuilder {
    return new AggExprBuilder("MAX", this.ref);
  }

  eq(value: unknown): WhereCondition {
    return new WhereCondition(this.ref, "=", value);
  }
  neq(value: unknown): WhereCondition {
    return new WhereCondition(this.ref, "!=", value);
  }
  gt(value: unknown): WhereCondition {
    return new WhereCondition(this.ref, ">", value);
  }
  lt(value: unknown): WhereCondition {
    return new WhereCondition(this.ref, "<", value);
  }
  gte(value: unknown): WhereCondition {
    return new WhereCondition(this.ref, ">=", value);
  }
  lte(value: unknown): WhereCondition {
    return new WhereCondition(this.ref, "<=", value);
  }
  between(a: unknown, b: unknown): WhereCondition {
    return new WhereCondition(this.ref, "BETWEEN", [a, b]);
  }
  in(values: unknown[]): WhereCondition {
    return new WhereCondition(this.ref, "IN", values);
  }

  // ─── Alias em português — Agregações ────────────────────────────────────
  soma(): AggExprBuilder {
    return this.sum();
  }
  media(): AggExprBuilder {
    return this.avg();
  }
  contar(): AggExprBuilder {
    return this.count();
  }
  minimo(): AggExprBuilder {
    return this.min();
  }
  maximo(): AggExprBuilder {
    return this.max();
  }

  // --- Condições WHERE ───────────────────────────────
  igual(value: unknown): WhereCondition {
    return this.eq(value);
  }
  diferente(value: unknown): WhereCondition {
    return this.neq(value);
  }
  maiorQue(value: unknown): WhereCondition {
    return this.gt(value);
  }
  menorQue(value: unknown): WhereCondition {
    return this.lt(value);
  }
  maiorOuIgual(value: unknown): WhereCondition {
    return this.gte(value);
  }
  menorOuIgual(value: unknown): WhereCondition {
    return this.lte(value);
  }
  entre(a: unknown, b: unknown): WhereCondition {
    return this.between(a, b);
  }
  dentroDe(values: unknown[]): WhereCondition {
    return this.in(values);
  }

  //Alias de coluna
  como(alias: string): AliasedColumn {
    return this.as(alias);
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