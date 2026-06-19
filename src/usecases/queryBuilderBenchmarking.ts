import { AnalyticsContext } from "@semantic/AnalyticsContext.js"
import { rank } from "../index.js"
import { lag } from "../index.js"
import 'dotenv/config'

const ctx = new AnalyticsContext(process.env.DB_STRING_CONNECTION)

const vendas = await ctx.table('vendas')

const resultado = await vendas
  .select([
    vendas.vendedor_id,
    vendas.mes,
    vendas.total.sum().as('total_vendas'),
    rank()
      .over(w => w.partitionBy('mes').orderBy(vendas.total.sum(), 'DESC'))
      .as('ranking'),
    lag(vendas.total.sum(), 1)
      .over(w => w.partitionBy('vendedor_id').orderBy('mes'))
      .as('mes_anterior'),
  ])
  .groupBy(vendas.vendedor_id, vendas.mes)
  .fetch()

console.table(resultado)
