import { PgAdapter } from '../infrastructure/adapters/PgAdapter.js'
import type { IDataSourceAdapter } from '../core/interfaces/IDataSourceAdapter.js' 
import { SemanticSelectBuilder } from '@builders/semantic/SemanticSelectBuilder.js'
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
    
    // 💡 INVERSÃO DE CONTROLE: Criamos a Table passando as funções que geram os builders.
    // Assim, a Table ganha o método .select() sem precisar importar a classe SemanticSelectBuilder.
    return new Table(name, schema, this.adapter, {
      select: (t, items) => new SemanticSelectBuilder(t, items, t.adapter),
      
      // Quando você for implementar o resto, bastará adicionar aqui:
      // update: (t, data) => new SemanticUpdateBuilder(t, data, t.adapter),
      // delete: (t, filter) => new SemanticDeleteBuilder(t, filter, t.adapter)
    })
  }
}