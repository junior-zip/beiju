import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AnalyticsContext } from '@semantic/AnalyticsContext.js'
import 'dotenv/config'
import { ou, classificar } from '../../../index.js'

const CONNECTION_STRING = process.env.DB_STRING_CONNECTION

describe('SemanticSelecBuilder — integração com PostgreSQL e ordenação atendida também via AggregateExpr', () => {
  let ctx: AnalyticsContext 
  let vendas: Awaited<ReturnType<AnalyticsContext['table']>>

  beforeAll(async () => {
    ctx = new AnalyticsContext(CONNECTION_STRING)
    vendas = await ctx.table('vendas')
  })

  afterAll(async () => {
    await (ctx as any).adapter.close()
  })

  it('deve construir a query de classificação corretamente', async () => {

   await vendas
    .selecione([
      vendas.vendedor_id,
      vendas.mes,
      vendas.total.soma().as("total_vendas"),
      classificar()
        .sobre((w) => 
          w.particionePor("mes").ordenePor(vendas.total.soma(), "DESC"),
        )
        .as("classificacao"),
    ])
    .onde(ou(vendas.vendedor_id.igual(1), vendas.vendedor_id.igual(2)))
    .agrupePor(vendas.vendedor_id, vendas.mes)
    .ordenePor(vendas.mes)
    .limite(10)
    .build();
  })
})