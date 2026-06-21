import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AnalyticsContext } from '@semantic/AnalyticsContext.js'
import { or, and } from '@core/ast/clause/WhereClause.js'
import 'dotenv/config'
const CONNECTION_STRING = process.env.DB_STRING_CONNECTION;

describe('Helpers or() e and() — integração com PostgreSQL real', () => {
  let ctx: AnalyticsContext
  let vendas: Awaited<ReturnType<AnalyticsContext['table']>>

  beforeAll(async () => {
    ctx = new AnalyticsContext(CONNECTION_STRING)
    vendas = await ctx.table('vendas')
  })

  afterAll(async () => {
    await (ctx as any).adapter.close()
  })

  it('or() retorna a união das condições', async () => {
    const result = await vendas
      .select([vendas.id, vendas.vendedor_id])
      .where(or(
        vendas.vendedor_id.eq(1),
        vendas.vendedor_id.eq(2),
      ))
      .fetch<{ id: number; vendedor_id: number }>()

    expect(result.length).toBeGreaterThan(0)
    const vendedores = new Set(result.map(r => r.vendedor_id))
    expect(vendedores.has(1)).toBe(true)
    expect(vendedores.has(2)).toBe(true)
    expect(vendedores.has(3)).toBe(false)
  })

  it('and() retorna apenas registros que satisfazem todas as condições', async () => {
    const result = await vendas
      .select([vendas.id, vendas.vendedor_id, vendas.total])
      .where(and(
        vendas.vendedor_id.eq(1),
        vendas.total.gt(500),
      ))
      .fetch<{ id: number; vendedor_id: number; total: string }>()

    expect(
      result.every(r => r.vendedor_id === 1 && Number(r.total) > 500)
    ).toBe(true)
  })

})