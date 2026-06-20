import { PgAdapter } from '../infrastructure/adapters/PgAdapter.js'
import type { IDataSourceAdapter } from '../core/interfaces/IDataSourceAdapter.js' 
import { SemanticSelectBuilder } from '@builders/semantic/SemanticSelectBuilder.js'
import { Table } from './Table.js' 
import { TypedColumn } from './TypedColumn.js'
import { createTable } from './Table.js'

export class AnalyticsContext {
  readonly adapter: IDataSourceAdapter

  constructor(connectionString: string) {
    this.adapter = AnalyticsContext.resolveAdapter(connectionString)
  }
  async table(name: string): Promise<Table & Record<string, TypedColumn>> {
    const schema = await this.adapter.introspect(name)
    
    return createTable(name, schema, this.adapter, (t, items) =>
      new SemanticSelectBuilder(t, items, t.adapter)
    )
  }

  private static resolveAdapter(cs: string): IDataSourceAdapter {
    if (cs.startsWith('postgresql://') || cs.startsWith('postgres://')) {
        return PgAdapter.getInstance(cs);
    
    }
    throw new Error(
      `AnalyticsContext: protocolo não suportado em "${cs}".\n` +
      `Protocolos aceitos: postgresql://, postgres://`
    )
  }
}