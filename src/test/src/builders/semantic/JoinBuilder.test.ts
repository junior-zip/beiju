import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SemanticSelectBuilder } from '@builders/semantic/SemanticSelectBuilder.js'
import type { IDataSourceAdapter } from '@core/interfaces/IDataSourceAdapter.js'
import { createTable } from '@semantic/Table.js'

const mockAdapter: IDataSourceAdapter = {
  execute:    vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  executeRaw: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  introspect: vi.fn(),
  close:      vi.fn(),
}

const factory = (t: any, items: any) =>
  new SemanticSelectBuilder(t, items, t.adapter)
const tableVendas = createTable('vendas', {
  tableName: 'vendas',
  columns: [
    { name: 'id',          type: 'number' as const, nullable: false },
    { name: 'usuario_id',  type: 'number' as const, nullable: false },
    { name: 'produto_id',  type: 'number' as const, nullable: false },
    { name: 'total',       type: 'number' as const, nullable: false },
    { name: 'month',       type: 'date'   as const, nullable: false },
  ],
}, mockAdapter, factory)

const tableUsuarios = createTable('usuarios', {
  tableName: 'usuarios',
  columns: [
    { name: 'id',   type: 'number' as const, nullable: false },
    { name: 'nome', type: 'string' as const, nullable: false },
  ],
}, mockAdapter, factory)

const tableProdutos = createTable('produtos', {
  tableName: 'produtos',
  columns: [
    { name: 'id',   type: 'number' as const, nullable: false },
    { name: 'nome', type: 'string' as const, nullable: false },
  ],
}, mockAdapter, factory)

beforeEach(() => vi.clearAllMocks())

describe('JoinBuilder', () => {
  it('gera INNER JOIN simples', async () => {
    const vendas   = tableVendas.usuario_id  
    const usuarios = tableUsuarios.id

    await tableVendas
      .select([tableVendas.id])
      .innerJoin(tableUsuarios).on(vendas, usuarios)
      .fetch()

    expect(mockAdapter.execute).toHaveBeenCalledWith(
      expect.stringContaining('INNER JOIN usuarios ON vendas.usuario_id = usuarios.id'),
      []
    )
  })

  it('gera LEFT JOIN', async () => {
    const vendas   = tableVendas.usuario_id
    const usuarios = tableUsuarios.id

    await tableVendas
      .select([tableVendas.id])
      .leftJoin(tableUsuarios).on(vendas, usuarios)
      .fetch()

    expect(mockAdapter.execute).toHaveBeenCalledWith(
      expect.stringContaining('LEFT JOIN'),
      []
    )
  })

  it('gera múltiplos JOINs na mesma query', async () => {
    await tableVendas
      .select([tableVendas.id])
      .innerJoin(tableUsuarios).on(
        tableVendas.usuario_id,
        tableUsuarios.id,
      )
      .leftJoin(tableProdutos).on(
        tableVendas.produto_id,
        tableProdutos.id,
      )
      .fetch()

    const sql = (mockAdapter.execute as ReturnType<typeof vi.fn>).mock.calls[0][0] as string

    expect(sql).toContain('INNER JOIN usuarios')
    expect(sql).toContain('LEFT JOIN produtos')
  })

  it('JOIN com alias de tabela', async () => {
    await tableVendas
      .select([tableVendas.id])
      .innerJoin(tableUsuarios).as('u').on(
        tableVendas.usuario_id,
        tableUsuarios.id,
      )
      .fetch()

    expect(mockAdapter.execute).toHaveBeenCalledWith(
      expect.stringContaining('INNER JOIN usuarios AS u'),
      []
    )
  })

  it('JOIN combinado com WHERE e GROUP BY', async () => {
    const month = tableVendas.month

    await tableVendas
      .select([
        tableVendas.id,
        (tableUsuarios.nome),
      ])
      .innerJoin(tableUsuarios).on(
        tableVendas.usuario_id,
        tableUsuarios.id,
      )
      .where(month.eq('2026-01'))
      .groupBy(tableUsuarios.nome)
      .fetch()

    const sql = (mockAdapter.execute as ReturnType<typeof vi.fn>).mock.calls[0][0] as string

    expect(sql).toContain('INNER JOIN usuarios')
    expect(sql).toContain('WHERE')
    expect(sql).toContain('GROUP BY')
  })

  it('a ordem SQL está correta: FROM → JOIN → WHERE → GROUP BY', async () => {
    const month = tableVendas.month

    await tableVendas
      .select([tableVendas.id])
      .innerJoin(tableUsuarios).on(
        tableVendas.usuario_id,
        tableUsuarios.id,
      )
      .where(month.eq('2026-01'))
      .groupBy(tableVendas.id)
      .fetch()

    const sql = (mockAdapter.execute as ReturnType<typeof vi.fn>).mock.calls[0][0] as string

    const fromPos    = sql.indexOf('FROM')
    const joinPos    = sql.indexOf('JOIN')
    const wherePos   = sql.indexOf('WHERE')
    const groupByPos = sql.indexOf('GROUP BY')

    expect(fromPos).toBeLessThan(joinPos)
    expect(joinPos).toBeLessThan(wherePos)
    expect(wherePos).toBeLessThan(groupByPos)
  })
})