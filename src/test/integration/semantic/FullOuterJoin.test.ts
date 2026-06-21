import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AnalyticsContext } from '@semantic/AnalyticsContext.js'
import type { TypedColumn } from '@semantic/TypedColumn.js'
import 'dotenv/config'

const CONNECTION_STRING = process.env.DB_STRING_CONNECTION

describe('FULL OUTER JOIN — integração com PostgreSQL real', () => {
  let ctx: AnalyticsContext
  let vendas: Awaited<ReturnType<AnalyticsContext['table']>>
  let vendedores: Awaited<ReturnType<AnalyticsContext['table']>>

  beforeAll(async () => {
    ctx = new AnalyticsContext(CONNECTION_STRING)
    vendas = await ctx.table('vendas')
    vendedores = await ctx.table('vendedores')
  })

  afterAll(async () => {
    await (ctx as any).adapter.close()
  })

  it('gera SQL com FULL OUTER JOIN', async () => {
    const result = await vendas
      .select([
        (vendas.id),
        (vendedores.nome),
      ])
      .fullOuterJoin(vendedores).on(
        vendas.vendedor_id ,
        vendedores.id,
      )
      .fetch()

    expect(Array.isArray(result)).toBe(true)
  })

  it('retorna vendedores sem vendas e vendas sem vendedor correspondente', async () => {
    // Insere um vendedor sem vendas associadas, para validar o lado direito do OUTER
      const adapter = (ctx as any).adapter

      await adapter.executeRaw(
      `SELECT setval('vendedores_id_seq', COALESCE((SELECT MAX(id) FROM vendedores), 1))`
      )

      await adapter.executeRaw(
    `DELETE FROM vendedores WHERE nome = $1`,
    ['Vendedor Sem Vendas']
    )

    await adapter.executeRaw(
        `INSERT INTO vendedores (nome, regiao) VALUES ($1, $2)`,
        ['Vendedor Sem Vendas', 'Centro-Oeste']
    )

    const result = await vendas
      .select([
        (vendas.id),
        (vendedores.nome),
      ])
      .fullOuterJoin(vendedores).on(
        vendas.vendedor_id,
        vendedores.id,
      )
      .fetch<{ id: number | null; nome: string | null }>()

    const semVendas = result.some(r => r.id === null && r.nome === 'Vendedor Sem Vendas')
    expect(semVendas).toBe(true)
  })

  it('SQL gerado contém a cláusula FULL OUTER JOIN', async () => {
    const builder = vendas
      .select([(vendas.id)])
      .fullOuterJoin(vendedores).on(
        vendas.vendedor_id,
        vendedores.id,
      )

    const { sql } = (builder as any).build
      ? (await import('@codegen/SqlGenerator.js')).SqlGenerator.compile((builder as any).build())
      : { sql: '' }

    expect(sql).toContain('FULL OUTER JOIN vendedores')
  })
})