import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AnalyticsContext } from '@semantic/AnalyticsContext.js'
import { WhereClause } from '@core/ast/clause/WhereClause.js'
import 'dotenv/config'

const CONNECTION_STRING = process.env.DB_STRING_CONNECTION;

describe('WHERE composto (AND/OR) — integração com PostgreSQL real', () => {
  let ctx: AnalyticsContext
  let vendas: Awaited<ReturnType<AnalyticsContext['table']>>

  beforeAll(async () => {
    ctx = new AnalyticsContext(CONNECTION_STRING)
    vendas = await ctx.table('vendas')
  })

  afterAll(async () => {
    await (ctx as any).adapter.close()
  })

  it('array de condições gera AND implícito', async () => {
    const result = await vendas
      .select([vendas.id, vendas.vendedor_id, vendas.total])
      .where([
        vendas.vendedor_id.eq(1),
        vendas.total.gt(500),
      ])
      .fetch<{ id: number; vendedor_id: number; total: string }>()

    expect(result.length).toBeGreaterThan(0)
    expect(
      result.every(r => r.vendedor_id === 1 && Number(r.total) > 500)
    ).toBe(true)
  })

  it('array de condições nunca retorna registros que violam alguma delas', async () => {
    // Condição propositalmente restritiva — combinação que poucos registros atendem
    const result = await vendas
      .select([vendas.id, vendas.vendedor_id, vendas.mes])
      .where([
        vendas.vendedor_id.eq(3),
        vendas.mes.eq('2026-01'),
      ])
      .fetch<{ id: number; vendedor_id: number; mes: string }>()

    expect(
      result.every(r => r.vendedor_id === 3 && r.mes === '2026-01')
    ).toBe(true)
  })

  it('WhereClause explícita com OR retorna união das condições', async () => {
    const condicaoOr = new WhereClause(
      [
        vendas.vendedor_id.eq(1),
        vendas.vendedor_id.eq(2),
      ],
      'OR',
    )

    const result = await vendas
      .select([vendas.id, vendas.vendedor_id])
      .where(condicaoOr)
      .fetch<{ id: number; vendedor_id: number }>()

    expect(result.length).toBeGreaterThan(0)
    expect(
      result.every(r => r.vendedor_id === 1 || r.vendedor_id === 2)
    ).toBe(true)

    const vendedoresEncontrados = new Set(result.map(r => r.vendedor_id))
    expect(vendedoresEncontrados.has(1)).toBe(true)
    expect(vendedoresEncontrados.has(2)).toBe(true)
  })

  it('WhereClause com OR exclui vendedores fora da lista', async () => {
    const condicaoOr = new WhereClause(
      [vendas.vendedor_id.eq(1), vendas.vendedor_id.eq(2)],
      'OR',
    )

    const result = await vendas
      .select([vendas.vendedor_id])
      .where(condicaoOr)
      .fetch<{ vendedor_id: number }>()

    expect(result.every(r => r.vendedor_id !== 3)).toBe(true)
  })

  it('condição única (sem array) continua funcionando como antes', async () => {
    const result = await vendas
      .select([vendas.id])
      .where(vendas.vendedor_id.eq(1))
      .fetch<{ id: number }>()

    expect(result.length).toBeGreaterThan(0)
  })
})