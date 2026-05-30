import type { AggregateExpr } from '../domain/model/expr/AggregateExpr.js'
import type { WindowFunctionExpr } from '../domain/model/expr/WindowFunctionExpr.js'
import type { ColumnRef } from '../domain/model/ColumnRef.js'
import type { WindowSpec } from '../domain/model/WindowSpec.js'
import type { OrderByItem} from '../domain/model/OrderByItem.js'
import type { FrameBoundary, FrameSpec } from '../domain/model/FrameSpec.js'
import type { SelectQuery } from '../domain/model/clause/SelectQuery.js'
import { SelectionItemType } from '../domain/types/SelectionItemType.js'
import type { WhereClause } from '../domain/model/clause/WhereClause.js'
import { WhereCondition } from '../domain/model/clause/WhereCondition.js'
import { ISqlCompileResult } from '../domain/interfaces/ISqlCompileResult.js'

export class SqlGenerator {
   public static compile(query: SelectQuery): ISqlCompileResult {
    const params: unknown[] = []

    const selectSql = query.select.map((item) => SqlGenerator.compileSelection(item)).join(', ')

    const fromSql = query.from.alias
      ? `${query.from.table} AS ${query.from.alias}`
      : query.from.table

    const clauses: string[] = [`SELECT ${selectSql}`, `FROM ${fromSql}`]

    if (query.where) {
      clauses.push(`WHERE ${SqlGenerator.compileWhere(query.where, params)}`)
    }

    if (query.groupBy?.length) {
      clauses.push(`GROUP BY ${query.groupBy.map((column) => SqlGenerator.compileColumn(column)).join(', ')}`)
    }

    if (query.orderBy?.length) {
      clauses.push(
        `ORDER BY ${query.orderBy.map((item) => SqlGenerator.compileOrderByItem(item)).join(', ')}`
      )
    }

    if (typeof query.limit === 'number') {
      clauses.push(`LIMIT ${query.limit}`)
    }

    if (typeof query.offset === 'number') {
      clauses.push(`OFFSET ${query.offset}`)
    }

    return {
      sql: clauses.join(' '),
      params,
    }
  }

  private static compileSelection(item: SelectionItemType): string {
    if (item.kind === 'ColumnRef') {
      return SqlGenerator.compileColumn(item)
    }

    if (item.kind === 'AggregateExpr') {
      return SqlGenerator.compileAggregate(item)
    }

    return SqlGenerator.compileWindowFn(item)
  }

  private static compileColumn(column: ColumnRef): string {
    return column.table ? `${column.table}.${column.column}` : column.column
  }

  private static compileAggregate(aggregate: AggregateExpr): string {
    const expr = `${aggregate.fn}(${SqlGenerator.compileColumn(aggregate.column)})`
    const withWindow = aggregate.window ? `${expr} ${SqlGenerator.compileWindow(aggregate.window)}` : expr

    return aggregate.alias ? `${withWindow} AS ${aggregate.alias}` : withWindow
  }

  private static compileWindowFn(windowFn: WindowFunctionExpr): string {
    const args: unknown[] = []

    if (windowFn.column) {
      args.push(SqlGenerator.compileColumn(windowFn.column))
    }

    if (typeof windowFn.offset === 'number') {
      args.push(windowFn.offset)
    }

    const fnExpr = `${windowFn.fn}(${args.join(', ')})`
    const withWindow = `${fnExpr} ${SqlGenerator.compileWindow(windowFn.window)}`

    return windowFn.alias ? `${withWindow} AS ${windowFn.alias}` : withWindow
  }

  private static compileWindow(window: WindowSpec): string {
    const parts: string[] = []

    if (window.partitionBy?.length) {
      parts.push(`PARTITION BY ${window.partitionBy.map((column) => SqlGenerator.compileColumn(column)).join(', ')}`)
    }

    if (window.orderBy?.length) {
      parts.push(`ORDER BY ${window.orderBy.map((item) => SqlGenerator.compileOrderByItem(item)).join(', ')}`)
    }

    if (window.frame) {
      parts.push(SqlGenerator.compileFrame(window.frame))
    }

    return `OVER (${parts.join(' ')})`
  }

  private static compileFrame(frame: FrameSpec): string {
    const start = SqlGenerator.compileFrameBoundary(frame.start)
    const end = SqlGenerator.compileFrameBoundary(frame.end)

    return `${frame.type} BETWEEN ${start} AND ${end}`
  }

  private static compileFrameBoundary(boundary: FrameBoundary): string {
    if (boundary === 'unbounded') {
      return 'UNBOUNDED PRECEDING'
    }

    if (boundary === 'current') {
      return 'CURRENT ROW'
    }

    if (boundary < 0) {
      return `${Math.abs(boundary)} PRECEDING`
    }

    if (boundary > 0) {
      return `${boundary} FOLLOWING`
    }

    return 'CURRENT ROW'
  }

  private static compileWhere(where: WhereClause, params: unknown[]): string {
    return where.conditions
      .map((condition) => SqlGenerator.compileCondition(condition, params))
      .join(` ${where.operator} `)
  }

  private static compileCondition(condition: WhereCondition, params: unknown[]): string {
    const columnSql = SqlGenerator.compileColumn(condition.column)

    if (condition.op === 'IN') {
      if (!Array.isArray(condition.value) || condition.value.length === 0) {
        throw new Error('IN operator requires a non-empty array value')
      }

      const placeholders = condition.value.map((value) => SqlGenerator.pushParam(params, value)).join(', ')
      return `${columnSql} IN (${placeholders})`
    }

    if (condition.op === 'BETWEEN') {
      if (!Array.isArray(condition.value) || condition.value.length !== 2) {
        throw new Error('BETWEEN operator requires an array with exactly two values')
      }

      const start = SqlGenerator.pushParam(params, condition.value[0])
      const end = SqlGenerator.pushParam(params, condition.value[1])

      return `${columnSql} BETWEEN ${start} AND ${end}`
    }

    const valuePlaceholder = SqlGenerator.pushParam(params, condition.value)
    return `${columnSql} ${condition.op} ${valuePlaceholder}`
  }

  private static compileOrderByItem(item: { column: ColumnRef; direction: 'ASC' | 'DESC' } | OrderByItem): string {
    return `${SqlGenerator.compileColumn(item.column)} ${item.direction}`
  }

  private static pushParam(params: unknown[], value: unknown): string {
    params.push(value)
    return `$${params.length}`
  }
}
