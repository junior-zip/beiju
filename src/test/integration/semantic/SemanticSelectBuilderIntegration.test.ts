import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AnalyticsContext } from '@semantic/AnalyticsContext.js'
import 'dotenv/config'

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

  it('ordena pelo total agregado (ORDER BY no nível externo da query)', async () => {
  const result = await vendas
    .select([vendas.vendedor_id, vendas.total.sum().as('total_vendas')])
    .groupBy(vendas.vendedor_id)
    .orderBy(vendas.total.sum(), 'DESC')
    .fetch<{ vendedor_id: number; total_vendas: string }>()

  expect(result.length).toBeGreaterThan(0)
  const valores = result.map(r => Number(r.total_vendas))
  const ordenado = [...valores].sort((a, b) => b - a)
  expect(valores).toEqual(ordenado)
})

})