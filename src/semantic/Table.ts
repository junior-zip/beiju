import { SemanticSelectBuilder } from './builder/SemanticSelectBuilder.js' 
import type { IDataSourceAdapter, TableSchema } from '../domain/interfaces/IDataSourceAdapter.js'
import { TypedColumn } from './TypedColumn.js'
import { type SemanticSelectionItem } from './builder/SemanticSelectBuilder.js'

import { ColumnRef } from '../domain/model/ColumnRef.js'

/**
 * Representa uma tabela/arquivo com schema conhecido.
 * As colunas são acessíveis como propriedades do objeto.
 *
 * Após: const orders = await ctx.table('orders')
 * Você acessa: orders.seller_name, orders.total_amount, etc.
 *
 * O índice de string ([key: string]) permite acesso dinâmico
 * quando o schema é descoberto em runtime.
 */
export class Table {
  [key: string]: TypedColumn | any  // permite orders.seller_name

  constructor(
    readonly tableName: string,
    readonly schema: TableSchema,
    private readonly adapter: IDataSourceAdapter,
  ) {
    // Registra cada coluna do schema como propriedade do objeto
    for (const col of schema.columns) {
      this[col.name] = new TypedColumn(col.name, col.type, tableName)
    }
  }
  
  select(items: any[]): SemanticSelectBuilder {
    return new SemanticSelectBuilder(this, items, this.adapter)
  }
  
}