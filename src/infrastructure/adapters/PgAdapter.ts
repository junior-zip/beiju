import { Pool, type PoolConfig } from 'pg'
import type { IDataSourceAdapter } from '../../domain/interfaces/IDataSourceAdapter.js'
import type { TableSchema, ColumnSchema } from '../../domain/interfaces/IDataSourceAdapter.js'
import type { QueryResult } from '../../domain/ports/QueryExecutor.js'
import { QueryResultRow } from 'pg'

const PG_TYPE_MAP: Record<string, ColumnSchema['type']> = {
  integer:          'number',
  int4:             'number',
  int8:             'number',
  bigint:           'number',
  smallint:         'number',
  numeric:          'number',
  decimal:          'number',
  real:             'number',
  float4:           'number',
  float8:           'number',
  'double precision': 'number',

  text:             'string',
  varchar:          'string',
  'character varying': 'string',
  char:             'string',
  bpchar:           'string',
  uuid:             'string',

  date:             'date',
  timestamp:        'date',
  timestamptz:      'date',
  'timestamp without time zone': 'date',
  'timestamp with time zone':    'date',

  bool:             'boolean',
  boolean:          'boolean',
}

/**
 * Linha retornada pela consulta ao information_schema.columns
 */
interface InformationSchemaRow {
  column_name: string
  data_type: string
  is_nullable: 'YES' | 'NO'
}

/**
 * Adapter para PostgreSQL.
 * Implementa IDataSourceAdapter — executa queries e introspecta schemas.
 *
 * Usa Singleton para o Pool de conexões:
 * um Pool por string de conexão, reutilizado em toda a aplicação.
 */
export class PgAdapter implements IDataSourceAdapter {
  private static instances: Map<string, PgAdapter> = new Map()

  private readonly pool: Pool
   
  private constructor(connectionString: string) {
    this.pool = new Pool({ connectionString })

    this.pool.on('error', (err: any) => {
      console.error('[PgAdapter] Erro inesperado no pool de conexões:', err)
    })
  }

  static getInstance(connectionString: string): PgAdapter {
    if (!PgAdapter.instances.has(connectionString)) {
      PgAdapter.instances.set(connectionString, new PgAdapter(connectionString))
    }
    return PgAdapter.instances.get(connectionString)!
  }

  /**
   * Executa uma query SQL parametrizada e retorna os resultados tipados.
   *
   * @param sql    — string SQL com placeholders ($1, $2, ...)
   * @param params — valores correspondentes aos placeholders
   */
  async execute<T extends QueryResultRow>(sql: string, params: unknown[]): Promise<QueryResult<T>> {
    const client = await this.pool.connect()

    try {
      const result = await client.query<T>(sql, params as unknown[])
      return {
        rows: result.rows,
        rowCount: result.rowCount ?? 0,
      }
    } finally {
      client.release()
    }
  }

  /**
   * Introspecta o schema de uma tabela consultando o information_schema.
   * Retorna as colunas com nome, tipo mapeado e nullable.
   *
   * Lança erro se a tabela não existir ou não tiver colunas visíveis.
   *
   * @param tableName — nome da tabela no PostgreSQL
   */
  async introspect(tableName: string): Promise<TableSchema> {
    const sql = `
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name   = $1
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    const result = await this.execute<InformationSchemaRow>(sql, [tableName])

    if (result.rows.length === 0) {
      throw new Error(
        `PgAdapter.introspect: tabela "${tableName}" não encontrada no schema public. ` +
        `Verifique se a tabela existe e se a conexão tem permissão de leitura.`
      )
    }

    const columns: ColumnSchema[] = result.rows.map((row: any) => ({
      name:     row.column_name,
      type:     PG_TYPE_MAP[row.data_type] ?? 'string',
      nullable: row.is_nullable === 'YES',
    }))

    return {
      tableName,
      columns,
    }
  }

  async close(): Promise<void> {
    await this.pool.end()
    PgAdapter.instances.delete(
      [...PgAdapter.instances.entries()]
        .find(([, v]) => v === this)?.[0] ?? ''
    )
  }
}