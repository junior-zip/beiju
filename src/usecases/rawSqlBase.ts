import { RawSql } from '@core/decorators/RawSql.js'
import type { IQueryExecutor } from '@core/interfaces/IQueryExecutor.js'
import { IRawQueryCheck } from '@core/interfaces/IRawQueryCheck.js'
import { PgAdapter } from '@infrastructure/adapters/PgAdapter.js'
import { AnalyticsContext } from '@semantic/AnalyticsContext.js'
import 'dotenv/config'

const CONNECTION_STRING = process.env.DB_STRING_CONNECTION

class VendasRepository {
  constructor(readonly executor: IQueryExecutor) {}

  @RawSql('SELECT * FROM vendas')
  async listarTodas(): Promise<any[]> { 
    return []
  }

  @RawSql('SELECT * FROM vendas WHERE vendedor_id = $1')
  async listarPorVendedor(vendedorId: number): Promise<any[]> { 
    return []
  }

  @RawSql('SELECT * FROM vendas WHERE mes = $1 AND total > $2')
  async listarPorMesEValor(mes: string, total: number): Promise<any[]> { 
    return []
  }

  @RawSql('SELECT vendas.id, vendas.produto FROM vendas WHERE produto = $1')
  async listarProdutoPorNomeProduto(produto: string){
     return []
    }
  
}

async function main() {
  const executor = PgAdapter.getInstance(CONNECTION_STRING)
  const repo = new VendasRepository(executor)
  const ctx = new AnalyticsContext(CONNECTION_STRING)

  console.log('\n── Iniciando métodos RawSQL Beiju ──────────────────────────\n')

  try {
    console.log('[1] listarTodas()')
    const todas = await repo.listarTodas()
    console.log(`    → ${todas.length} registros retornados`)
    console.table(todas.slice(0, 3))

    console.log('[2] listarPorVendedor(1)')
    const porVendedor = await repo.listarPorVendedor(1)
    console.log(`    → ${porVendedor.length} registros retornados`)
    console.table(porVendedor.slice(0, 3))

    console.log('[3] listarPorMesEValor("2026-01", 500)')
    const filtradas = await repo.listarPorMesEValor('2026-01', 500)
    console.log(`    → ${filtradas.length} registros retornados`)
    console.table(filtradas.slice(0, 3))

    console.log('[5] Semantic Layer — listarProdutoPorNomeProduto(Produto A)')
    const produto = await repo.listarProdutoPorNomeProduto('Produto A')
    console.log(`    → ${produto.length} registros retornados`)
    console.table(produto.slice(0, 3))

    console.log('[6] Semantic Layer — ranking de vendas via Raw sql')
    const vendas = await ctx.table('vendas')
    console.log(`    → schema detectado: [${vendas.columnNames.join(', ')}]`)

  } catch (err: any) {
    console.error('\n[ERRO]', err.message)
    console.error('Verifique se o PostgreSQL está rodando e se a tabela "vendas" existe.')
  } finally {
    await executor.close()
    console.log('\n── Conexão encerrada ──────────────────────────────\n')
  }
}

main()