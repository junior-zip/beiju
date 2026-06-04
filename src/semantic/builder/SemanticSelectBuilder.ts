import type { WhereClause as WhereClauseType } from '../../domain/model/clause/WhereClause.js'
import type { IDataSourceAdapter } from '../../domain/interfaces/IDataSourceAdapter.js' 
import type { WhereCondition } from '../../domain/model/clause/WhereCondition.js' 
import { WhereClause } from '../../domain/model/clause/WhereClause.js'
import { SelectQuery } from '../../domain/model/clause/SelectQuery.js' 
import { ColumnRef } from '../../domain/model/ColumnRef.js'
import { OrderByItem } from '../../domain/model/OrderByItem.js'
import { SqlGenerator } from '../../codegen/SqlGenerator.js' 
import { AggExprBuilder } from '../../application/builders/AggExprBuilder.js' 
import { WindowFnExprBuilder } from '../../application/builders/WindowFnExprBuilder.js'
import { TypedColumn } from '../TypedColumn.js' 
import { AliasedColumn } from '../TypedColumn.js'
import { Table } from '../Table.js' 



/**
 * Tipos aceitos no .select() do SemanticSelectBuilder.
 * O dev passa colunas, agregações ou window functions — sem strings.
 */
export type SemanticSelectionItem =
  | TypedColumn
  | AliasedColumn
  | AggExprBuilder
  | WindowFnExprBuilder

/**
 * Tipos aceitos no .where() do SemanticSelectBuilder.
 */
export type WhereInput =
  | WhereCondition
  | WhereCondition[]
  | WhereClause

/**
 * Builder de consultas analíticas orientado a semântica.
 * Construído sobre o SelectQuery e SqlGenerator existentes,
 * mas expõe uma API onde colunas são objetos, não strings.
 *
 * Criado internamente pelo Table.select() — não instancie diretamente.
 *
 * Exemplo:
 *   const orders = await ctx.table('orders')
 *
 *   const result = await orders
 *     .select([
 *       orders.seller_name,
 *       orders.total_amount.sum().as('total_vendas'),
 *       rank()
 *         .over(w => w.orderBy(orders.total_amount.name, 'DESC'))
 *         .as('ranking'),
 *     ])
 *     .where(orders.month.eq('2026-01'))
 *     .groupBy(orders.seller_name)
 *     .orderBy(orders.total_amount, 'DESC')
 *     .limit(10)
 *     .fetch()
 */
export class SemanticSelectBuilder {
  private whereInput?: WhereInput
  private groupByColumns: ColumnRef[] = []
  private orderByItems: OrderByItem[] = []
  private limitValue?: number
  private offsetValue?: number

  constructor(
    private readonly table: Table,
    private readonly selections: SemanticSelectionItem[],
    private readonly adapter: IDataSourceAdapter,
  ) {}

  // --- Cláusulas encadeáveis ---

  where(input: WhereInput): this {
    this.whereInput = input
    return this
  }

  groupBy(...columns: TypedColumn[]): this {
    this.groupByColumns = columns.map(col => col.ref)
    return this
  }

  orderBy(column: TypedColumn, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByItems.push(new OrderByItem(column.ref, direction))
    return this
  }

  limit(n: number): this {
    this.limitValue = n
    return this
  }

  offset(n: number): this {
    this.offsetValue = n
    return this
  }

  // --- Compilação ---

  /**
   * Resolve os itens do select para os tipos da AST.
   * AggExprBuilder e WindowFnExprBuilder são "buildados" aqui.
   */
  private resolveSelections(): SelectQuery['select'] {
    return this.selections.map(item => {
      if (item instanceof AggExprBuilder)     return item.build()
      if (item instanceof WindowFnExprBuilder) return item.build()
      return item.ref  // TypedColumn → ColumnRef
    })
  }

  /**
   * Resolve o WhereInput para WhereClause da AST.
   * Aceita condição única, array de condições ou WhereClause direta.
   */
  private resolveWhere(): SelectQuery['where'] {
    if (!this.whereInput) return undefined

    // Importação inline para evitar dependência circular
    if (this.whereInput instanceof WhereClause) {
      return this.whereInput
    }

    if (Array.isArray(this.whereInput)) {
      return new WhereClause(this.whereInput, 'AND')
    }

    // Condição única — envolve em WhereClause automaticamente
    return new WhereClause([this.whereInput], 'AND')
  }

  /**
   * Monta o SelectQuery (AST) com todos os dados acumulados.
   */
  build(): SelectQuery {
    return new SelectQuery(
      { table: this.table.tableName },
      this.resolveSelections(),
      this.resolveWhere(),
      this.groupByColumns.length > 0 ? this.groupByColumns : undefined,
      this.orderByItems.length  > 0 ? this.orderByItems  : undefined,
      this.limitValue,
      this.offsetValue,
    )
  }

  /**
   * Compila para SQL, executa no adapter e retorna os resultados tipados.
   */
  async fetch<T extends Record<string, any> = any>(): Promise<T[]> {
    const query = this.build()
    const { sql, params } = SqlGenerator.compile(query)
    const result = await this.adapter.execute<T>(sql, params)
    return result.rows
  }
}