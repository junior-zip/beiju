import { PgAdapter } from '@infrastructure/adapters/PgAdapter.js'
import { AnalyticsContext } from '@semantic/AnalyticsContext.js'
import { RawSql } from '@core/decorators/RawSql.js' 
import type { IQueryExecutor } from '@core/interfaces/IQueryExecutor.js' 
import { WindowFnExprBuilder } from '@builders/relational/WindowFnExprBuilder.js'
import { AggExprBuilder } from '@builders/relational/AggExprBuilder.js' 
import { ColumnRef } from '@core/ColumnRef.js' 
import { SqlGenerator } from '@codegen/SqlGenerator.js'
import { TypedColumn } from '@semantic/TypedColumn.js'
import 'dotenv/config'

export const avg = (col: string | TypedColumn | AggExprBuilder) => {
  if (col instanceof AggExprBuilder) {

    return new AggExprBuilder('AVG', col.build() as any)
  }
  if (col instanceof TypedColumn) {

    return new AggExprBuilder('AVG', col.ref)
  }
  return new AggExprBuilder('AVG', new ColumnRef(col, 'number'))
}

const rank = () =>
  new WindowFnExprBuilder('RANK')

const avgOver = (col: string) =>
  new AggExprBuilder('AVG', new ColumnRef(col, 'number'))

const CONNECTION_STRING = process.env.DB_STRING_CONNECTION

// ─── Tipos de resultado ───────────────────────────────────────────────────────

interface RankingVendas {
  vendedor_id: number
  mes: string
  total_vendas: number
  ranking: number
}

interface ComparacaoTemporal {
  vendedor_id: number
  mes: string
  total_vendas: number
  mes_anterior: number | null
  variacao_absoluta: number | null
}

interface MediaMovel {
  mes: string
  total_vendas: number
  media_movel_3m: number
}

interface RankingComJoin {
  nome_vendedor: string
  mes: string
  total_vendas:number
  ranking_regional: number
  regiao: string
}

// ─── Repositório Raw SQL ──────────────────────────────────────────────────────
// Abordagem tradicional: strings SQL nativas, sem type-safety de colunas

class VendasRawRepository {
  constructor(readonly executor: IQueryExecutor) {}

  // CASO 1 — Ranking de vendedores por mês
  @RawSql(`
    SELECT
      vendedor_id,
      mes,
      SUM(total) AS total_vendas,
      RANK() OVER (
        PARTITION BY mes
        ORDER BY SUM(total) DESC
      ) AS ranking
    FROM vendas
    GROUP BY vendedor_id, mes
    ORDER BY mes, ranking
  `)
  async rankingPorMes(): Promise<RankingVendas[]> { return [] }

  // CASO 2 — Comparação com mês anterior (LAG)
  @RawSql(`
    WITH vendas_mensais AS (
      SELECT
        vendedor_id,
        mes,
        SUM(total) AS total_vendas
      FROM vendas
      GROUP BY vendedor_id, mes
    )
    SELECT
      vendedor_id,
      mes,
      total_vendas,
      LAG(total_vendas, 1) OVER (
        PARTITION BY vendedor_id
        ORDER BY mes
      )                                        AS mes_anterior,
      total_vendas - LAG(total_vendas, 1) OVER (
        PARTITION BY vendedor_id
        ORDER BY mes
      )                                        AS variacao_absoluta
    FROM vendas_mensais
    ORDER BY vendedor_id, mes
  `)
  async comparacaoMesAnterior(): Promise<ComparacaoTemporal[]> { return [] }

  // CASO 3 — Média móvel de 3 meses
  @RawSql(`
    WITH vendas_mensais AS (
      SELECT
        mes,
        SUM(total) AS total_vendas
      FROM vendas
      GROUP BY mes
    )
    SELECT
      mes,
      total_vendas,
      ROUND(
        AVG(total_vendas) OVER (
          ORDER BY mes
          ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ), 2
      )                                        AS media_movel_3m
    FROM vendas_mensais
    ORDER BY mes
  `)
  async mediaMovel3Meses(): Promise<MediaMovel[]> { return [] }

  // CASO 4 — Ranking regional com JOIN
  @RawSql(`
    SELECT
      v.nome                                   AS nome_vendedor,
      vd.mes,
      SUM(vd.total)                            AS total_vendas,
      RANK() OVER (
        PARTITION BY v.regiao, vd.mes
        ORDER BY SUM(vd.total) DESC
      )                                        AS ranking_regional,
      v.regiao
    FROM vendas vd
    INNER JOIN vendedores v ON vd.vendedor_id = v.id
    GROUP BY v.nome, vd.mes, v.regiao
    ORDER BY vd.mes, v.regiao, ranking_regional
  `)
  async rankingRegionalComJoin(): Promise<RankingComJoin[]> { return [] }
}

// ─── Helpers de log ───────────────────────────────────────────────────────────

const linha  = (char = '─', n = 60) => char.repeat(n)
const titulo = (label: string) => {
  console.log('\n' + linha('═'))
  console.log(`  ${label}`)
  console.log(linha('═'))
}
const caso = (n: number, label: string, abordagem: 'RAW SQL' | 'BEIJU') => {
  const emoji = abordagem === 'RAW SQL' ? '🔴' : '🟢'
  console.log(`\n${emoji}  CASO ${n} [${abordagem}] — ${label}`)
  console.log(linha())
}
const tempo = (ms: number) =>
  `  ⏱  Executado em ${ms}ms`

const printResultado = (rows: any[], max = 4) => {
  if (rows.length === 0) {
    console.log('  → Nenhum resultado.')
    return
  }
  console.log(`  → ${rows.length} linhas retornadas:`)
  console.table(rows.slice(0, max))
  if (rows.length > max) {
    console.log(`  ... e mais ${rows.length - max} linhas`)
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const executor = PgAdapter.getInstance(CONNECTION_STRING)
  const rawRepo = new VendasRawRepository(executor)
  const ctx = new AnalyticsContext(CONNECTION_STRING)

  

  titulo('Beiju — Estudo de Caso Comparativo')
  console.log('  Raw SQL vs Query Builder com Semantic Layer')
  console.log('  4 consultas analíticas, 2 abordagens cada')

  // ══════════════════════════════════════════════════════════════════════════
  // CASO 1 — Ranking de vendedores por mês
  // ══════════════════════════════════════════════════════════════════════════

  caso(1, 'Ranking de vendedores por mês', 'RAW SQL')
  console.log(`
  SQL EXECUTADO:
  ┌────────────────────────────────────────────────────────┐
  │  SELECT vendedor_id, mes,                              │
  │    SUM(total) AS total_vendas,                         │
  │    RANK() OVER (                                       │
  │      PARTITION BY mes ORDER BY SUM(total) DESC         │
  │    ) AS ranking                                        │
  │  FROM vendas                                           │
  │  GROUP BY vendedor_id, mes ORDER BY mes, ranking       │
  └────────────────────────────────────────────────────────┘
  Linhas de código SQL: 8 | Strings literais: SIM | Type-safe: NÃO`)

  let t0 = Date.now()
  const r1Raw = await rawRepo.rankingPorMes()
  console.log(tempo(Date.now() - t0))
  printResultado(r1Raw)

  caso(1, 'Ranking de vendedores por mês', 'BEIJU')
  console.log(`
  CÓDIGO BEIJU:
  ┌────────────────────────────────────────────────────────┐
  │  const vendas = await ctx.table('vendas')              │
  │                                                        │
  │  await vendas                                          │
  │    .select([                                           │
  │      vendas.vendedor_id,                               │
  │      vendas.mes,                                       │
  │      vendas.total.sum().as('total_vendas'),            │
  │      rank()                                            │
  │        .over(w => w                                    │
  │          .partitionBy('mes')                           │
  │          .orderBy('total', 'DESC'))                    │
  │        .as('ranking'),                                 │
  │    ])                                                  │
  │    .groupBy(vendas.vendedor_id, vendas.mes)            │
  │    .orderBy(vendas.mes)                                │
  │    .fetch()                                            │
  └────────────────────────────────────────────────────────┘
  Linhas de código: 13 | Strings literais: NÃO | Type-safe: SIM`)

  const vendas = await ctx.table('vendas')

  const { rank,lag } = await import('./../index.js') 

    t0 = Date.now()

  
  const r1Beiju = await vendas
    .select([
      vendas.vendedor_id,
      vendas.mes,
      (vendas.total).sum().as('total_vendas'),
      rank()
        .over(w => w.partitionBy('mes').orderBy(vendas.total.sum(), 'DESC'))
        .as('ranking'),
    ])
    .groupBy(
      vendas.vendedor_id,
      vendas.mes,
    )
    .orderBy(vendas.mes)
    .fetch()

  console.log(tempo(Date.now() - t0))
  printResultado(r1Beiju)

  // ══════════════════════════════════════════════════════════════════════════
  // CASO 2 — Comparação com mês anterior (LAG)
  // ══════════════════════════════════════════════════════════════════════════

  caso(2, 'Comparação com período anterior — LAG()', 'RAW SQL')
  console.log(`
  SQL EXECUTADO:
  ┌────────────────────────────────────────────────────────┐
  │  WITH vendas_mensais AS (                              │
  │    SELECT vendedor_id, mes, SUM(total) AS total_vendas │
  │    FROM vendas GROUP BY vendedor_id, mes               │
  │  )                                                     │
  │  SELECT vendedor_id, mes, total_vendas,                │
  │    LAG(total_vendas, 1) OVER (                         │
  │      PARTITION BY vendedor_id ORDER BY mes             │
  │    ) AS mes_anterior,                                  │
  │    total_vendas - LAG(total_vendas,1) OVER (           │
  │      PARTITION BY vendedor_id ORDER BY mes             │
  │    ) AS variacao_absoluta                              │
  │  FROM vendas_mensais ORDER BY vendedor_id, mes         │
  └────────────────────────────────────────────────────────┘
  Linhas de código SQL: 14 | Strings literais: SIM | Type-safe: NÃO`)

  t0 = Date.now()
  const r2Raw = await rawRepo.comparacaoMesAnterior()
  console.log(tempo(Date.now() - t0))
  printResultado(r2Raw)

  caso(2, 'Comparação com período anterior — LAG()', 'BEIJU')
  console.log(`
  CÓDIGO BEIJU:
  ┌────────────────────────────────────────────────────────┐
  │  await vendas                                          │
  │    .select([                                           │
  │      vendas.vendedor_id,                               │
  │      vendas.mes,                                       │
  │      vendas.total.sum().as('total_vendas'),            │
  │      lag('total', 1)                                   │
  │        .over(w => w                                    │
  │          .partitionBy('vendedor_id')                   │
  │          .orderBy('mes'))                              │
  │        .as('mes_anterior'),                            │
  │    ])                                                  │
  │    .groupBy(vendas.vendedor_id, vendas.mes)            │
  │    .orderBy(vendas.vendedor_id, vendas.mes)            │
  │    .fetch()                                            │
  └────────────────────────────────────────────────────────┘
  Linhas de código: 12 | Strings literais: NÃO | Type-safe: SIM`)

  t0 = Date.now()
  const r2Beiju = await vendas
    .select([
      vendas.vendedor_id,
      vendas.mes,
      (vendas.total).sum().as('total_vendas'),
      lag(vendas.total.sum(), 1)
        .over(w => w.partitionBy('vendedor_id').orderBy('mes'))
        .as('mes_anterior'),
    ])
    .groupBy(
      vendas.vendedor_id,
      vendas.mes,
    )
    .orderBy(vendas.vendedor_id)
    .fetch()

  console.log(tempo(Date.now() - t0))
  printResultado(r2Beiju)
  

  // ══════════════════════════════════════════════════════════════════════════
  // CASO 3 — Média móvel de 3 meses
  // ══════════════════════════════════════════════════════════════════════════

  caso(3, 'Média móvel de 3 meses — AVG() OVER ROWS BETWEEN', 'RAW SQL')
  console.log(`
  SQL EXECUTADO:
  ┌────────────────────────────────────────────────────────┐
  │  WITH vendas_mensais AS (                              │
  │    SELECT mes, SUM(total) AS total_vendas              │
  │    FROM vendas GROUP BY mes                            │
  │  )                                                     │
  │  SELECT mes, total_vendas,                             │
  │    ROUND(                                              │
  │      AVG(total_vendas) OVER (                          │
  │        ORDER BY mes                                    │
  │        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW        │
  │      ), 2                                              │
  │    ) AS media_movel_3m                                 │
  │  FROM vendas_mensais ORDER BY mes                      │
  └────────────────────────────────────────────────────────┘
  Linhas de código SQL: 13 | Strings literais: SIM | Type-safe: NÃO`)

  t0 = Date.now()
  const r3Raw = await rawRepo.mediaMovel3Meses()
  console.log(tempo(Date.now() - t0))
  printResultado(r3Raw)

  caso(3, 'Média móvel de 3 meses — AVG() OVER ROWS BETWEEN', 'BEIJU')
  console.log(`
  CÓDIGO BEIJU:
  ┌────────────────────────────────────────────────────────┐
  │  await vendas                                          │
  │    .select([                                           │
  │      vendas.mes,                                       │
  │      vendas.total.sum().as('total_vendas'),            │
  │      vendas.total.avg()                                │
  │        .over(w => w                                    │
  │          .orderBy('mes')                               │
  │          .rowsBetween(-2, 'current'))                  │
  │        .as('media_movel_3m'),                          │
  │    ])                                                  │
  │    .groupBy(vendas.mes)                                │
  │    .orderBy(vendas.mes)                                │
  │    .fetch()                                            │
  └────────────────────────────────────────────────────────┘
  Linhas de código: 12 | Strings literais: NÃO | Type-safe: SIM`)


  t0 = Date.now();

 const query3 = vendas
  .select([
    vendas.mes,
    (vendas.total).sum().as('total_vendas'),
    avg(vendas.total.sum())
      .over(w => w.orderBy('mes').rowsBetween(-2, 'current'))
      .as('media_movel_3m'),
  ])
  .groupBy(vendas.mes)
  .orderBy(vendas.mes)

  // Debug — inspeciona o SQL antes de executar
  const { sql, params } = SqlGenerator.compile((query3 as any).build());
  console.log("\n[DEBUG SQL CASO 3]\n", sql);
  console.log("[DEBUG PARAMS]", params);

  const r3Beiju = await query3.fetch();

  console.log(tempo(Date.now() - t0));
  printResultado(r3Beiju);
  // ══════════════════════════════════════════════════════════════════════════
  // CASO 4 — Ranking regional com INNER JOIN
  // ══════════════════════════════════════════════════════════════════════════

  caso(4, 'Ranking regional com INNER JOIN', 'RAW SQL')
  console.log(`
  SQL EXECUTADO:
  ┌────────────────────────────────────────────────────────┐
  │  SELECT v.nome AS nome_vendedor, vd.mes,               │
  │    SUM(vd.total) AS total_vendas,                      │
  │    RANK() OVER (                                       │
  │      PARTITION BY v.regiao, vd.mes                     │
  │      ORDER BY SUM(vd.total) DESC                       │
  │    ) AS ranking_regional,                              │
  │    v.regiao                                            │
  │  FROM vendas vd                                        │
  │  INNER JOIN vendedores v ON vd.vendedor_id = v.id      │
  │  GROUP BY v.nome, vd.mes, v.regiao                     │
  │  ORDER BY vd.mes, v.regiao, ranking_regional           │
  └────────────────────────────────────────────────────────┘
  Linhas de código SQL: 11 | Strings literais: SIM | Type-safe: NÃO`)

  t0 = Date.now()
  const r4Raw = await rawRepo.rankingRegionalComJoin()
  console.log(tempo(Date.now() - t0))
  printResultado(r4Raw)

  caso(4, 'Ranking regional com INNER JOIN', 'BEIJU')
  console.log(`
  CÓDIGO BEIJU:
  ┌────────────────────────────────────────────────────────┐
  │  const vendedores = await ctx.table('vendedores')      │
  │                                                        │
  │  await vendas                                          │
  │    .select([                                           │
  │      vendedores.nome.as('nome_vendedor'),              │
  │      vendas.mes,                                       │
  │      vendas.total.sum().as('total_vendas'),            │
  │      rank()                                            │
  │        .over(w => w                                    │
  │          .partitionBy('regiao', 'mes')                 │
  │          .orderBy('total', 'DESC'))                    │
  │        .as('ranking_regional'),                        │
  │      vendedores.regiao,                                │
  │    ])                                                  │
  │    .innerJoin(vendedores)                              │
  │      .on(vendas.vendedor_id, vendedores.id)            │
  │    .groupBy(                                           │
  │      vendedores.nome,                                  │
  │      vendas.mes,                                       │
  │      vendedores.regiao,                                │
  │    )                                                   │
  │    .orderBy(vendas.mes)                                │
  │    .fetch()                                            │
  └────────────────────────────────────────────────────────┘
  Linhas de código: 22 | Strings literais: NÃO | Type-safe: SIM`)

  t0 = Date.now()
  const vendedores = await ctx.table('vendedores')

  const r4Beiju = await vendas
    .select([
      (vendedores.nome).as('nome_vendedor'),
      vendas.mes,
      (vendas.total).sum().as('total_vendas'),
      rank()
        .over(w => w
          .partitionBy('regiao' ,'mes')
          .orderBy(vendas.total.sum(), 'DESC'))
        .as('ranking_regional'),
      vendedores.regiao,
    ])
    .innerJoin(vendedores)
      .on(vendas.vendedor_id, vendedores.id)
    .groupBy(
      vendedores.nome,
      vendas.mes,
      vendedores.regiao,
    )
    .orderBy(vendas.mes)
    .fetch()

  console.log(tempo(Date.now() - t0))
  printResultado(r4Beiju)

  // ══════════════════════════════════════════════════════════════════════════
  // SUMÁRIO COMPARATIVO
  // ══════════════════════════════════════════════════════════════════════════

  titulo('Sumário Comparativo')
  console.table([
    {
      Caso:             '1 — Ranking por mês',
      'Raw SQL (linhas)': 8,
      'Beiju (linhas)':  13,
      'Strings literais Raw': 'SIM',
      'Strings literais Beiju': 'NÃO',
      'Type-safe Raw': 'NÃO',
      'Type-safe Beiju': 'SIM',
    },
    {
      Caso:             '2 — LAG / período anterior',
      'Raw SQL (linhas)': 14,
      'Beiju (linhas)':  12,
      'Strings literais Raw': 'SIM',
      'Strings literais Beiju': 'NÃO',
      'Type-safe Raw': 'NÃO',
      'Type-safe Beiju': 'SIM',
    },
    {
      Caso:             '3 — Média móvel 3m',
      'Raw SQL (linhas)': 13,
      'Beiju (linhas)':  12,
      'Strings literais Raw': 'SIM',
      'Strings literais Beiju': 'NÃO',
      'Type-safe Raw': 'NÃO',
      'Type-safe Beiju': 'SIM',
    },
    {
      Caso:             '4 — JOIN + Ranking regional',
      'Raw SQL (linhas)': 11,
      'Beiju (linhas)':  22,
      'Strings literais Raw': 'SIM',
      'Strings literais Beiju': 'NÃO',
      'Type-safe Raw': 'NÃO',
      'Type-safe Beiju': 'SIM',
    },
  ])

  console.log(`
  Observações:
  • Em Raw SQL, erros de coluna só aparecem em RUNTIME (no banco)
  • No Beiju, erros de coluna são capturados em COMPILE-TIME (TypeScript)
  • O Caso 4 com JOIN tem mais linhas no Beiju — mas todas com autocomplete
  • Raw SQL não permite refatoração segura de nomes de colunas
  • O Beiju permite trocar o adapter (PostgreSQL → CSV) sem alterar a query
  `)

  await executor.close()
  console.log(linha('─'))
  console.log('  Conexão encerrada.')
  console.log(linha('─') + '\n')
}


main().catch(console.error)