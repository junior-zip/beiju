import { describe, expect, it } from 'vitest'
import { ColumnRef, ColumnRef as columnRef } from '@core/ColumnRef.js';
import { SqlGenerator } from '@codegen/SqlGenerator.js'; 
import { OrderByExpr } from '@core/ast/OrderByItem.js';
import { AggregateExpr } from '@core/ast/expr/AggregateExpr.js';

export function columRefParamns(column: string, type: any, table?: string ): ColumnRef{

  return new ColumnRef(column, type, table);
}

describe('SqlGenerator', () => {
  it('gera SELECT simples com WHERE', () => {
    const query = {
      from: { table: 'orders', alias: 'o' },
      select: [new columnRef('seller_name', 'string', 'o')],
      where: {
        conditions: [{ column: new columnRef('month', 'string', 'o'), op: '=' as const, value: '2026-01' }],
        operator: 'AND' as const,
      },
    }

    const compiled = SqlGenerator.compile(query)

    expect(compiled).toEqual({
      sql: 'SELECT o.seller_name FROM orders AS o WHERE o.month = $1',
      params: ['2026-01'],
    })
  })

  it('gera SELECT com GROUP BY e agregação', () => {
    const query = {
      from: { table: 'orders'},
      select: [
        new columnRef('seller_name', 'string'),
        {
          kind: 'AggregateExpr' as const,
          fn: 'SUM' as const,
          column: new columnRef('total_amount', 'number'),
          alias: 'total_sales',
        },
      ],
      groupBy: [new columnRef('seller_name', 'string')],
    }

    const compiled = SqlGenerator.compile(query)

    expect(compiled).toEqual({
      sql: 'SELECT seller_name, SUM(total_amount) AS total_sales FROM orders GROUP BY seller_name',
      params: [],
    })
  })

  it('gera SELECT com Window Function RANK e LAG', () => {

    const query = {
      from: { table: 'orders', alias: 'o'},
      select: [
        {
          kind: 'WindowFunctionExpr' as const,
          fn: 'RANK' as const,
          window: {
            kind: 'WindowSpec' as const,
            orderBy: [
              {
                kind: 'OrderByItem' as const,
                expr: new columnRef('total_amount', 'number', 'o'),
                direction: 'DESC' as const,
              },
            ],
          },
          alias: 'ranking',
        },
        {
          kind: 'WindowFunctionExpr' as const,
          fn: 'LAG' as const,
          column: new columnRef('total_amount', 'number', 'o'),
          offset: 1,
          window: {
            kind: 'WindowSpec' as const,
            orderBy: [
              {
                kind: 'OrderByItem' as const,
                expr: new columnRef('month', 'number', 'o'),
                direction: 'ASC' as const,
              },
            ],
          },
          alias: 'prev_month',
        },
      ],
    }

    const compiled = SqlGenerator.compile(query)

    expect(compiled).toEqual({
      sql: 'SELECT RANK() OVER (ORDER BY o.total_amount DESC) AS ranking, LAG(o.total_amount, 1, 1) OVER (ORDER BY o.month ASC) AS prev_month FROM orders AS o',
      params: [],
    })
  })

  it('gera OVER com PARTITION BY e ORDER BY', () => {
    const query = {
      from: { table: 'orders', alias: 'o' },
      select: [
        {
          kind: 'WindowFunctionExpr' as const,
          fn: 'ROW_NUMBER' as const,
          window: {
            kind: 'WindowSpec' as const,
            partitionBy: [new columnRef('seller_name', 'string', 'o')],
            orderBy: [
              {
                kind: 'OrderByItem' as const,
                expr: new columnRef('total_amount', 'number', 'o'), 
                direction: 'DESC' as const,
              },
            ],
          },
          alias: 'row_num',
        },
      ],
    }

    const compiled = SqlGenerator.compile(query)

    expect(compiled).toEqual({
      sql: 'SELECT ROW_NUMBER() OVER (PARTITION BY o.seller_name ORDER BY o.total_amount DESC) AS row_num FROM orders AS o',
      params: [],
    })
  })

  it("compila agregação duplamente aninhada corretamente", () => {
    const nested = new AggregateExpr(
      "AVG",
      new AggregateExpr("SUM", new ColumnRef("total", "number", "vendas")),
    );

    const sql = (SqlGenerator as any).compileAggregate(nested);
    expect(sql).toBe("AVG(SUM(vendas.total))");
  });
})
