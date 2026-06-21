import type { WhereClause as WhereClauseType } from '@core/ast/clause/WhereClause.js'
import type { IDataSourceAdapter } from '@core/interfaces/IDataSourceAdapter.js' 
import type { WhereCondition } from '@core/ast/clause/WhereCondition.js' 
import { WhereClause } from '@core/ast/clause/WhereClause.js'
import { SelectQuery } from '@core/ast/clause/SelectQuery.js' 
import { ColumnRef } from '@core/ColumnRef.js' 
import { OrderByItem, resolveOrderByExpr} from '@core/ast/OrderByItem.js' 
import { SqlGenerator } from '../../codegen/SqlGenerator.js' 
import { AggExprBuilder } from '@builders/relational/AggExprBuilder.js' 
import { WindowFnExprBuilder } from '@builders/relational/WindowFnExprBuilder.js' 
import { TypedColumn } from '../../semantic/TypedColumn.js' 
import { AliasedColumn } from '../../semantic/TypedColumn.js'
import { Table } from '../../semantic/Table.js' 
import { JoinSpec } from '@core/ast/JoinSpec.js'
import { JoinBuilder } from '@builders/relational/JoinBuilder.js'
import { ISemanticSelectBuilder } from '@core/interfaces/ISemanticSelectBuilder.js'
import { SelectBuilder } from '@builders/relational/SelectBuilder.js'

export type SemanticSelectionItem =
  | TypedColumn
  | AliasedColumn
  | AggExprBuilder
  | WindowFnExprBuilder

export type WhereInput =
  | WhereCondition
  | WhereCondition[]
  | WhereClause

export class SemanticSelectBuilder implements ISemanticSelectBuilder {
  private whereInput?: WhereInput;
  private groupByColumns: ColumnRef[] = [];
  private orderByItems: OrderByItem[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private joinSpecs: JoinSpec[] = [];

  constructor(
    private readonly table: Table,
    private readonly selections: SemanticSelectionItem[],
    private readonly adapter: IDataSourceAdapter,
  ) {}

  where(input: WhereInput): this {
    this.whereInput = input;
    return this;
  }

  groupBy(...columns: TypedColumn[]): this {
    this.groupByColumns = columns.map((col) => col.ref);
    return this;
  }

  orderBy(column: TypedColumn | AggExprBuilder, direction: "ASC" | "DESC" = "ASC"): this {
    const expr = resolveOrderByExpr(column)
    this.orderByItems.push(new OrderByItem(expr, direction));
    return this;
  }

  limit(n: number): this {
    this.limitValue = n;
    return this;
  }

  offset(n: number): this {
    this.offsetValue = n;
    return this;
  }

  private addJoin(spec: JoinSpec): this {
    this.joinSpecs.push(spec);
    return this;
  }

  join(table: Table): JoinBuilder<this> {
    return new JoinBuilder(table, (spec) => this.addJoin(spec), "JOIN");
  }

  innerJoin(table: Table): JoinBuilder<this> {
    return new JoinBuilder(table, (spec) => this.addJoin(spec), "INNER");
  }

  leftJoin(table: Table): JoinBuilder<this> {
    return new JoinBuilder(table, (spec) => this.addJoin(spec), "LEFT");
  }

  rightJoin(table: Table): JoinBuilder<this> {
    return new JoinBuilder(table, (spec) => this.addJoin(spec), "RIGHT");
  }

  fullOuterJoin(table: Table): JoinBuilder<this> {
    return new JoinBuilder(table, (spec) => this.addJoin(spec), "FULL OUTER");
  }

  onde(input: WhereInput): this {
    return this.where(input);
  }

  agrupePor(...columns: TypedColumn[]): this {
    return this.groupBy(...columns);
  }

  ordenePor(column: TypedColumn | AggExprBuilder, direction: "ASC" | "DESC" = "ASC"): this {
    return this.orderBy(column, direction);
  }

  limite(n: number): this {
    return this.limit(n);
  }

  deslocamento(n: number): this {
    return this.offset(n);
  }

  // ─── Alias em português — JOINs ─────────────────────────────────────────
  juncaoInterna(table: Table): JoinBuilder<this> {
    return this.innerJoin(table);
  }
  
  //equivalente ao join sozinho sem prefixo inner
  junte(table: Table): JoinBuilder<this> {
    return this.innerJoin(table);
  }

  juncaoEsquerda(table: Table): JoinBuilder<this> {
    return this.leftJoin(table);
  }

  juncaoDireita(table: Table): JoinBuilder<this> {
    return this.rightJoin(table);
  }

  juncaoExterna(table: Table): JoinBuilder<this> {
    return this.fullOuterJoin(table);
  }

  private resolveSelections(): SelectQuery["select"] {
    return this.selections.map((item) => {
      if (item instanceof AggExprBuilder) return item.build();
      if (item instanceof WindowFnExprBuilder) return item.build();
      return item.ref;
    });
  }

  buscar<T>(): Promise<T[]> {
  return this.fetch<T>()
  }

  private resolveWhere(): SelectQuery["where"] {
    if (!this.whereInput) return undefined;

    if (this.whereInput instanceof WhereClause) {
      return this.whereInput;
    }

    if (Array.isArray(this.whereInput)) {
      return new WhereClause(this.whereInput, "AND");
    }

    return new WhereClause([this.whereInput], "AND");
  }

  build(): SelectQuery {
    return new SelectQuery(
      { table: this.table.tableName },
      this.resolveSelections(),
      this.resolveWhere(),
      this.joinSpecs.length > 0 ? this.joinSpecs : undefined,
      this.groupByColumns.length > 0 ? this.groupByColumns : undefined,
      this.orderByItems.length > 0 ? this.orderByItems : undefined,
      this.limitValue,
      this.offsetValue,
    );
  }

  async fetch<T>(): Promise<T[]> {
    const query = this.build();
    const { sql, params } = SqlGenerator.compile(query);
    const result = await this.adapter.execute(sql, params);
    return result.rows;
  }
}