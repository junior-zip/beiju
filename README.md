# Beiju

  <img width="260" height="238" alt="image" src="https://github.com/user-attachments/assets/8c994bf2-2e6e-4e86-bfac-2458982b1f54" />
</div>
 
**Beiju** | [Leia em Português 🇧🇷](./README.pt-br.md)

**Beiju-site** | (demo) | **[beiju-dev.github.io/beiju-site](https://beiju-dev.github.io/beiju-site/)**


**An analytical query builder for Node.js, with a Semantic Layer and bilingual API (English / Portuguese).**
 
Beiju compiles fluent TypeScript method chains into safe, parameterized SQL, abstracting OLAP operations (Window Functions, aggregations, JOINs, temporal comparisons) that traditional ORMs like Prisma and TypeORM were never designed to handle.
 
```typescript
const result = await vendas
  .select([
    vendas.vendedor_id,
    vendas.total.sum().as('total_vendas'),
    rank()
      .over(w => w.partitionBy('mes').orderBy(vendas.total.sum(), 'DESC'))
      .as('ranking'),
  ])
  .groupBy(vendas.vendedor_id, vendas.mes)
  .fetch()
```
 
No raw SQL strings. No manual column casting. Full IDE autocomplete and compile-time type checking on every column reference.
 
---
 
## Why Beiju?
 
Node.js has mature ORMs for transactional (OLTP) workloads, but a real gap exists when a backend developer needs to build a sales ranking, a month-over-month comparison, or a moving average directly inside the application. The usual path is dropping into raw SQL strings, losing type safety and readability in the process.
 
Beiju closes that gap with a **Semantic Layer**: instead of writing `SELECT`, `WHERE`, and `GROUP BY` against string column names, you reference columns as typed objects (`vendas.total`, `vendas.vendedor_id`), introspected automatically from your PostgreSQL schema at runtime.
 
---
 
## Installation
 
```bash
npm install @beiju-dev/beiju
```
 
> Requires Node.js 20+ and PostgreSQL.
 
---
 
## Quick Start
 
### English API
 
```typescript
import { AnalyticsContext, rank } from '@beiju-dev/beiju'
 
const ctx = new AnalyticsContext('postgresql://user:pass@localhost:5432/mydb')
const vendas = await ctx.table('vendas')
 
const result = await vendas
  .select([
    vendas.vendedor_id,
    vendas.mes,
    vendas.total.sum().as('total_vendas'),
    rank()
      .over(w => w.partitionBy('mes').orderBy(vendas.total.sum(), 'DESC'))
      .as('ranking'),
  ])
  .where(vendas.mes.eq('2026-01'))
  .groupBy(vendas.vendedor_id, vendas.mes)
  .fetch()
```
 
### API em Português
 
A mesma biblioteca, o mesmo motor, vocabulário localizado:
 
```typescript
import { AnalyticsContext, classificar } from '@beiju-dev/beiju'
 
const ctx = new AnalyticsContext('postgresql://user:pass@localhost:5432/mydb')
const vendas = await ctx.table('vendas')
 
const resultado = await vendas
  .selecione([
    vendas.vendedor_id,
    vendas.mes,
    vendas.total.soma().como('total_vendas'),
    classificar()
      .sobre(w => w.particionePor('mes').ordenePor(vendas.total.soma(), 'DESC'))
      .como('classificacao'),
  ])
  .onde(vendas.mes.igual('2026-01'))
  .agrupePor(vendas.vendedor_id, vendas.mes)
  .buscar()
```
 
Both forms produce the exact same SQL. Pick whichever vocabulary fits your team, or mix them freely in the same query.
 
---
 
## Features
 
- **Window Functions**: `RANK`, `DENSE_RANK`, `ROW_NUMBER`, `LAG`, `LEAD`, `NTILE`, with full `PARTITION BY` / `ORDER BY` / `ROWS BETWEEN` support
- **Aggregations**: `SUM`, `AVG`, `COUNT`, `MIN`, `MAX`, including nested aggregates (`AVG(SUM(col))`)
- **JOINs**: `INNER`, `LEFT`, `RIGHT`, `FULL OUTER`
- **Composable WHERE**: comparison operators, `BETWEEN`, `IN`, plus `or()` / `and()` helpers
- **Automatic schema introspection**: no manual table mapping, columns are typed and autocompletable out of the box
- **`@RawSql` escape hatch**: drop down to native SQL when needed, sharing the same connection and parameter-binding safety
- **Portuguese aliases**: every method in the Semantic Layer has a Portuguese equivalent

---

## Architecture
 
Beiju is built in four layers, following Hexagonal Architecture and Domain-Driven Design:
 
```
Semantic Layer    →  AnalyticsContext, Table, TypedColumn
Builders          →  Fluent DSL (SelectBuilder, WindowBuilder, JoinBuilder)
Core (Compiler)   →  AST nodes + SqlGenerator
Infrastructure    →  PgAdapter (PostgreSQL)
```
 
The core never imports infrastructure code. Query construction (builders) is entirely decoupled from SQL generation (`SqlGenerator`), which is decoupled from execution (`PgAdapter`). This is what makes the compiler core fully unit-testable without a live database connection.
 
---
 
## Project Status
 
Beiju was developed as an undergraduate thesis (TCC) project at **Instituto Federal de Sergipe, Campus Lagarto**, in the Sistemas de Informação program. It is functional and validated against PostgreSQL with both unit and integration tests, but should be considered a research artifact rather than a production-hardened library at this stage.
 
**Currently out of scope** (tracked as future work): CSV/Parquet adapters, `HAVING`, `DISTINCT`, nested WHERE grouping with mixed AND/OR precedence, and CTE support.
 
---
 
## Contributing

Beiju is open source and contributions are welcome, whether that's a bug report, a new adapter, additional Window Functions, or improvements to the Portuguese vocabulary. Feel free to open an issue to discuss an idea before submitting a pull request.

See [CONTRIBUTING.md](./CONTRIBUTING.md) · [CONTRIBUINDO.md](./CONTRIBUINDO.md)

If you're using Beiju in a real project or experimenting with it for study purposes, we'd love to hear about it.
 
---
 
## License
 
MIT. See [LICENSE.md](./LICENSE.md).
 
---
 
## Acknowledgments
 
Developed by Gilson Teixeira do Sacramento Junior as an academic project at the Instituto Federal de Sergipe.
