import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AnalyticsContext } from '@semantic/AnalyticsContext.js'
import 'dotenv/config'

const CONNECTION_STRING = process.env.DB_STRING_CONNECTION

describe('WHERE operators — integração com PostgreSQL real', () => {
  let ctx: AnalyticsContext
  let vendas: Awaited<ReturnType<AnalyticsContext['table']>>

  beforeAll(async () => {
    ctx = new AnalyticsContext(CONNECTION_STRING)
    vendas = await ctx.table('vendas')
  })

  afterAll(async () => {
    await (ctx as any).adapter.close()
  })

  it('neq — exclui registros com valor igual', async () => {
    const result = await vendas
      .select([vendas.id, vendas.vendedor_id])
      .where((vendas.vendedor_id).neq(1))
      .fetch<{ id: number; vendedor_id: number }>()

    expect(result.length).toBeGreaterThan(0)
    expect(result.every(r => r.vendedor_id !== 1)).toBe(true)
  })

  it('gt — retorna apenas valores maiores que o limite', async () => {
    const result = await vendas
      .select([vendas.id, vendas.total])
      .where((vendas.total).gt(1000))
      .fetch<{ id: number; total: string }>()

    expect(result.length).toBeGreaterThan(0)
    expect(result.every(r => Number(r.total) > 1000)).toBe(true)
  })

  it('lt — retorna apenas valores menores que o limite', async () => {
    const result = await vendas
      .select([vendas.id, vendas.total])
      .where((vendas.total).lt(1000))
      .fetch<{ id: number; total: string }>()

    expect(result.length).toBeGreaterThan(0)
    expect(result.every(r => Number(r.total) < 1000)).toBe(true)
  })

  it('gte — inclui o valor-limite na comparação', async () => {
    const result = await vendas
      .select([vendas.id , vendas.total ])
      .where((vendas.total ).gte(1200))
      .fetch<{ id: number; total: string }>()

    expect(result.length).toBeGreaterThan(0)
    expect(result.every(r => Number(r.total) >= 1200)).toBe(true)
  })

  it('lte — inclui o valor-limite na comparação', async () => {
    const result = await vendas
      .select([vendas.id , vendas.total ])
      .where((vendas.total ).lte(850))
      .fetch<{ id: number; total: string }>()

    expect(result.length).toBeGreaterThan(0)
    expect(result.every(r => Number(r.total) <= 850)).toBe(true)
  })

  it('between — retorna valores dentro do intervalo inclusivo', async () => {
    const result = await vendas
      .select([vendas.id , vendas.total ])
      .where((vendas.total ).between(800, 2000))
      .fetch<{ id: number; total: string }>()

    expect(result.length).toBeGreaterThan(0)
    expect(
      result.every(r => Number(r.total) >= 800 && Number(r.total) <= 2000)
    ).toBe(true)
  })

  it('in — retorna apenas os registros cujo valor está na lista', async () => {
    const result = await vendas
      .select([vendas.id, vendas.vendedor_id])
      .where((vendas.vendedor_id).in([1, 3]))
      .fetch<{ id: number; vendedor_id: number }>()

    expect(result.length).toBeGreaterThan(0)
    expect(result.every(r => [1, 3].includes(r.vendedor_id))).toBe(true)
  })

  it('in — lança erro de SQL se a lista estiver vazia', async () => {
    await expect(
      vendas
        .select([vendas.id])
        .where((vendas.vendedor_id).in([]))
        .fetch()
    ).rejects.toThrow('IN operator requires a non-empty array value')
  })
})