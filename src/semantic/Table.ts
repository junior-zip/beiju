import { ISemanticSelectBuilder } from '@core/interfaces/ISemanticSelectBuilder.js';
import type { IDataSourceAdapter, TableSchema } from '../core/interfaces/IDataSourceAdapter.js' 
import { TypedColumn } from './TypedColumn.js'
import { SemanticSelectionItem } from '@builders/semantic/SemanticSelectBuilder.js';
type QueryFactory = (table: Table, items: any[]) => any;

export type SelectBuilderFactory = (
  table: Table,
  items: SemanticSelectionItem[],
) => ISemanticSelectBuilder

export class Table {
    private readonly _columns: Map<string, TypedColumn> = new Map()

  constructor(
    readonly tableName: string,
    readonly schema: TableSchema,
    readonly adapter: IDataSourceAdapter,
    private readonly _builderFactory?: SelectBuilderFactory,
  ) {

    for (const col of schema.columns) {
      this._columns.set(
        col.name,
        new TypedColumn(col.name, col.type, tableName),
      )
    }
  }
  getColumn(name: string): TypedColumn | undefined {
    return this._columns.get(name)
  }

  get columnNames(): string[] {
    return [...this._columns.keys()]
  }

  select(items: SemanticSelectionItem[]) {
    if (!this._builderFactory) {
      throw new Error(
        `Table "${this.tableName}": nenhuma factory registrada. ` +
        `Crie tabelas via AnalyticsContext.table() em vez de instanciar Table diretamente.`
      )
    }
    return this._builderFactory(this, items)
  }

  selecione(items: SemanticSelectionItem[]) {
    return this.select(items)
  }  
  

}
  
export function createTable(
  tableName: string,
  schema: TableSchema,
  adapter: IDataSourceAdapter,
  builderFactory?: SelectBuilderFactory,
): Table & Record<string, TypedColumn> {
  const table = new Table(tableName, schema, adapter, builderFactory)

  return new Proxy(table, {
    get(target, prop: string | symbol) {
      // Prioridade 1: métodos e propriedades reais da classe
      if (prop in target) {
        const val = (target as any)[prop]
        return typeof val === 'function' ? val.bind(target) : val
      }
      // Prioridade 2: coluna do schema
      if (typeof prop === 'string') {
        return target.getColumn(prop)
      }
      return undefined
    },
  }) as Table & Record<string, TypedColumn>
}