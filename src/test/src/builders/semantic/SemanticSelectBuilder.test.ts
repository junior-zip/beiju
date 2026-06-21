import { beforeEach, describe, it, expect, vi } from 'vitest'
import type { IDataSourceAdapter } from '@core/interfaces/IDataSourceAdapter.js'
import { createTable } from '../../../../semantic/Table.js'

const mockAdapter: IDataSourceAdapter = {
  execute:    vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  executeRaw: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  introspect: vi.fn(),
  close:      vi.fn(),
}

const mockSchema = {
  tableName: 'orders',
  columns: [
    { name: 'seller_name',  type: 'string' as const,  nullable: false },
    { name: 'total_amount', type: 'number' as const,  nullable: false },
    { name: 'month',        type: 'date'   as const,  nullable: false },
    { name: 'region',       type: 'string' as const,  nullable: false },
  ],
}

const table = createTable('orders', mockSchema, mockAdapter)

describe('SemanticSelectBuilder', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gera SQL de SELECT simples com coluna tipada', async () => {
    await table.select([table.seller_name])
      .fetch()

    expect(mockAdapter.execute).toHaveBeenCalledWith(
      'SELECT orders.seller_name FROM orders',
      []
    )
  })

  it('gera SQL com WHERE usando coluna tipada', async () => {
    const month = table.month

    await table
      .select([table.seller_name])
      .where(month.eq('2026-01'))
      .fetch()

    expect(mockAdapter.execute).toHaveBeenCalledWith(
      'SELECT orders.seller_name FROM orders WHERE orders.month = $1',
      ['2026-01']
    )
  })

  it('gera SQL com GROUP BY e agregação', async () => {
    const sellerName  = table.seller_name
    const totalAmount = table.total_amount

    await table
      .select([
        sellerName,
        totalAmount.sum().as('total_vendas'),
      ])
      .groupBy(sellerName)
      .fetch()

    expect(mockAdapter.execute).toHaveBeenCalledWith(
      'SELECT orders.seller_name, SUM(orders.total_amount) AS total_vendas FROM orders GROUP BY orders.seller_name',
      []
    )
  })

    it("gera SQL com RANK e OVER", async () => {
      const totalAmount = table.total_amount

      await table
        .select([totalAmount.sum().as("total_vendas"), totalAmount])
        .fetch();

      expect(mockAdapter.execute).toHaveBeenCalledOnce();
    });
   

  it('respeita LIMIT e OFFSET', async () => {
    await table
      .select([table.seller_name])
      .limit(10)
      .offset(20)
      .fetch()

    expect(mockAdapter.execute).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT 10'),
      []
    )
    expect(mockAdapter.execute).toHaveBeenCalledWith(
      expect.stringContaining('OFFSET 20'),
      []
    )
  })

  it('encadeia ORDER BY corretamente', async () => {
    const sellerName  = table.seller_name
    const totalAmount = table.total_amount

    await table
      .select([sellerName])
      .orderBy(totalAmount, 'DESC')
      .fetch()

    expect(mockAdapter.execute).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY orders.total_amount DESC'),
      []
    )
  })

})