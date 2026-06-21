import { AnalyticsContext } from '../semantic/AnalyticsContext.js'
import { classificar, anterior, ou, e } from '../index.js'
import 'dotenv/config'

const CONNECTION_STRING = process.env.DB_STRING_CONNECTION

const linha  = (char = '─', n = 60) => char.repeat(n)
const titulo = (texto: string) => {
  console.log('\n' + linha('═'))
  console.log(`  ${texto}`)
  console.log(linha('═'))
}

async function main() {
  const ctx    = new AnalyticsContext(CONNECTION_STRING)
  const vendas = await ctx.table('vendas')

  titulo('Beiju — Exemplo de uso em português')
  console.log('  Mesma engine, vocabulário localizado.\n')

  // ══════════════════════════════════════════════════════════════════════
  // EXEMPLO 1 — Consulta simples com filtro e ordenação
  // ══════════════════════════════════════════════════════════════════════

  titulo('[1] Consulta simples — selecione / onde / ordenePor')

  const exemplo1 = await vendas
    .selecione([
      vendas.vendedor_id,
      vendas.mes,
      vendas.total,
    ])
    .where(vendas.total.gt(500))
    .orderBy(vendas.total, 'DESC')
    .limit(5)
    .fetch()

  console.table(exemplo1)

  // ══════════════════════════════════════════════════════════════════════
  // EXEMPLO 2 — Agregação com alias e agrupamento
  // ══════════════════════════════════════════════════════════════════════

  titulo('[2] Agregação — soma / como / agrupePor')

  const exemplo2 = await vendas
    .selecione([
      vendas.vendedor_id,
      vendas.total.soma().como('total_vendido'),
    ])
    .agrupePor(vendas.vendedor_id)
    .ordenePor(vendas.total.soma(), 'DESC')
    .buscar()

  console.table(exemplo2)

  // ══════════════════════════════════════════════════════════════════════
  // EXEMPLO 3 — Window Function: ranking por mês
  // ══════════════════════════════════════════════════════════════════════

  titulo('[3] Função de janela — classificar / sobre / particionePor')

  const exemplo3 = await vendas
    .selecione([
      vendas.vendedor_id,
      vendas.mes,
      vendas.total.soma().como('total_vendas'),
      classificar()
        .sobre(w => w
          .particionePor('mes')
          .ordenePor(vendas.total.soma(), 'DESC'))
        .como('classificacao'),
    ])
    .agrupePor(vendas.vendedor_id, vendas.mes)
    .ordenePor(vendas.mes)
    .buscar()

  console.table(exemplo3)

  // ══════════════════════════════════════════════════════════════════════
  // EXEMPLO 4 — Comparação com mês anterior (LAG)
  // ══════════════════════════════════════════════════════════════════════

  titulo('[4] Comparação temporal — anterior() (alias de lag)')

  const exemplo4 = await vendas
    .selecione([
      vendas.vendedor_id,
      vendas.mes,
      vendas.total.soma().como('total_vendas'),
      anterior(vendas.total.soma(), 1)
        .sobre(w => w
          .particionePor('vendedor_id')
          .ordenePor('mes'))
        .como('total_mes_anterior'),
    ])
    .agrupePor(vendas.vendedor_id, vendas.mes)
    .ordenePor(vendas.vendedor_id)
    .buscar()

  console.table(exemplo4)

  // ══════════════════════════════════════════════════════════════════════
  // EXEMPLO 5 — Condição composta com ou()
  // ══════════════════════════════════════════════════════════════════════

  titulo('[5] Condição composta — ou() filtrando múltiplos vendedores')

  const exemplo5 = await vendas
    .selecione([vendas.vendedor_id, vendas.mes, vendas.total])
    .onde(ou(
      vendas.vendedor_id.igual(1),
      vendas.vendedor_id.igual(2),
    ))
    .buscar()

  console.table(exemplo5)

  // ══════════════════════════════════════════════════════════════════════
  // EXEMPLO 6 — Condição composta com e()
  // ══════════════════════════════════════════════════════════════════════

  titulo('[6] Condição composta — e() combinando filtros')

  const exemplo6 = await vendas
    .selecione([vendas.vendedor_id, vendas.mes, vendas.total])
    .onde(e(
      vendas.vendedor_id.igual(1),
      vendas.total.maiorQue(500),
    ))
    .buscar()

  console.table(exemplo6)

  // ══════════════════════════════════════════════════════════════════════
  // EXEMPLO 7 — Junção entre tabelas (vendas + vendedores)
  // ══════════════════════════════════════════════════════════════════════

  titulo('[7] Junção — juncaoInterna / em / como')

  const vendedores = await ctx.table('vendedores')

  const exemplo7 = await vendas
    .selecione([
      vendedores.nome.como('nome_vendedor'),
      vendas.mes,
      vendas.total.soma().como('total_vendas'),
    ])
    .juncaoInterna(vendedores).em(vendas.vendedor_id, vendedores.id)
    .agrupePor(vendedores.nome, vendas.mes)
    .ordenePor(vendas.mes)
    .buscar()

  console.table(exemplo7)

  // ══════════════════════════════════════════════════════════════════════

  await (ctx as any).adapter.close()
  console.log('\n' + linha('─'))
  console.log('  Conexão encerrada.')
  console.log(linha('─') + '\n')
}

main().catch(console.error)