import type { IDataSourceAdapter, TableSchema } from '../core/interfaces/IDataSourceAdapter.js' 
import { TypedColumn } from './TypedColumn.js'
type QueryFactory = (table: Table, items: any[]) => any;
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
    readonly adapter: IDataSourceAdapter,
    private readonly factories: { 
      select: (table: Table, items: any[]) => any 
      // update?: (table: Table, data: any) => any
    }
  ) {
    // Registra cada coluna do schema como propriedade do objeto
    for (const col of schema.columns) {
      this[col.name] = new TypedColumn(col.name, col.type, tableName)
    }
  }
  
  select(items: any[]) {
    return this.factories.select(this, items)
  }
  
}