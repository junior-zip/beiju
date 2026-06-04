import { PgAdapter } from '../infrastructure/adapters/PgAdapter.js'
//import { CsvAdapter } from '../infrastructure/adapters/CsvAdapter.js'
import type { IDataSourceAdapter } from '../domain/interfaces/IDataSourceAdapter.js'
import { Table } from './Table.js' 
/**
 * Ponto de entrada do Beiju.
 * Recebe uma connection string e instancia o adapter correto.
 *
 * Exemplos de connection string:
 *   postgresql://user:pass@localhost:5432/mydb
 *   csv://./data/orders.csv
 *   parquet://./data/orders.parquet
 */
export class AnalyticsContext {
  private readonly adapter: IDataSourceAdapter

  constructor(connectionString: string) {
    this.adapter = AnalyticsContext.resolveAdapter(connectionString)
  }

  private static resolveAdapter(cs: string): IDataSourceAdapter {
    if (cs.startsWith('postgresql://') || cs.startsWith('postgres://')) {
        return PgAdapter.getInstance(cs);
    
    }
    /*
    if (cs.startsWith('csv://')) {
      return new CsvAdapter(cs.replace('csv://', ''))
    }
      */

    throw new Error(
      `AnalyticsContext: protocolo não suportado em "${cs}".\n` +
      `Protocolos aceitos: postgresql://, csv://, parquet://`
    )
  }

  /**
   * Introspecta o schema da tabela/arquivo e retorna um objeto
   * cujas propriedades são as colunas — com autocomplete e tipos.
   */
  async table(name: string): Promise<Table> {
    const schema = await this.adapter.introspect(name)
    return new Table(name, schema, this.adapter)
  }
}