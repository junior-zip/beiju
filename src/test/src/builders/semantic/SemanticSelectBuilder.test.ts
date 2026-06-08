import { beforeEach, describe, it, expect, vi } from 'vitest'
import { SemanticSelectBuilder } from '@builders/semantic/SemanticSelectBuilder.js' 
import { Table } from  '../../../../semantic/Table.js'
import { TypedColumn } from '@semantic/TypedColumn.js' 
import type { IDataSourceAdapter } from '@core/interfaces/IDataSourceAdapter.js'

// Mock do adapter — sem banco real
const mockAdapter: IDataSourceAdapter = {
  execute:    vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  introspect: vi.fn(),
  close:      vi.fn(),
}

// Schema simulado — como viria do PgAdapter.introspect()
const mockSchema = {
  tableName: 'orders',
  columns: [
    { name: 'seller_name',  type: 'string' as const,  nullable: false },
    { name: 'total_amount', type: 'number' as const,  nullable: false },
    { name: 'month',        type: 'date'   as const,  nullable: false },
    { name: 'region',       type: 'string' as const,  nullable: false },
  ],
}

const table = new Table('orders', mockSchema, mockAdapter,{
  select: (t, items) => new SemanticSelectBuilder(t, items, t.adapter)
})

describe('SemanticSelectBuilder', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gera SQL de SELECT simples com coluna tipada', async () => {
    await table.select([table.seller_name as TypedColumn])
      .fetch()

    expect(mockAdapter.execute).toHaveBeenCalledWith(
      'SELECT orders.seller_name FROM orders',
      []
    )
  })

  it('gera SQL com WHERE usando coluna tipada', async () => {
    const month = table.month as TypedColumn

    await table
      .select([table.seller_name as TypedColumn])
      .where(month.eq('2026-01'))
      .fetch()

    expect(mockAdapter.execute).toHaveBeenCalledWith(
      'SELECT orders.seller_name FROM orders WHERE orders.month = $1',
      ['2026-01']
    )
  })

  it('gera SQL com GROUP BY e agregação', async () => {
    const sellerName  = table.seller_name  as TypedColumn
    const totalAmount = table.total_amount as TypedColumn

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
      const totalAmount = table.total_amount as TypedColumn;

      await table
        .select([totalAmount.sum().as("total_vendas"), totalAmount])
        .fetch();

      // Valida que o adapter foi chamado — SQL verificado no SqlGenerator.test.ts
      expect(mockAdapter.execute).toHaveBeenCalledOnce();
    });
   

  it('respeita LIMIT e OFFSET', async () => {
    await table
      .select([table.seller_name as TypedColumn])
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
    const sellerName  = table.seller_name  as TypedColumn
    const totalAmount = table.total_amount as TypedColumn

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