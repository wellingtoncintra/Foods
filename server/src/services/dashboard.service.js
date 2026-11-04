// Métricas do dashboard (RF007, RF008, RF009).
// Regra 7: somente vendas CONCLUIDAS entram nas métricas; canceladas aparecem só como informação.
// Regra 9: dias e meses calculados no fuso de Cuiabá.
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { FUSO, filtroPeriodo, hojeCuiaba } from '../lib/periodo.js';

const ZERO = new Prisma.Decimal(0);
const MAX_DIAS_SERIE_DIARIA = 92;

const dec = (v) => (v === null || v === undefined ? ZERO : new Prisma.Decimal(v));
const texto = (d) => d.toFixed(2);

// Percentual com 1 casa ("51.3"); null quando o total é zero
const percentual = (parte, total) => (total.isZero() ? null : parte.div(total).mul(100).toFixed(1));

// Condição SQL do período sobre v.data_hora
function condicaoPeriodo(periodo) {
  const f = filtroPeriodo(periodo) ?? {};
  return Prisma.sql`${f.gte ? Prisma.sql`AND v.data_hora >= ${f.gte}` : Prisma.empty} ${f.lt ? Prisma.sql`AND v.data_hora < ${f.lt}` : Prisma.empty}`;
}

// Lista de chaves "AAAA-MM-DD" (dia) ou "AAAA-MM-01" (mês) entre duas datas, inclusive
function chavesDoIntervalo(inicio, fim, agrupamento) {
  const chaves = [];
  const [a, m, d] = inicio.split('-').map(Number);
  let atual = agrupamento === 'mes' ? new Date(Date.UTC(a, m - 1, 1)) : new Date(Date.UTC(a, m - 1, d));
  const limite = fim;
  while (atual.toISOString().slice(0, 10) <= limite) {
    chaves.push(atual.toISOString().slice(0, 10));
    atual =
      agrupamento === 'mes'
        ? new Date(Date.UTC(atual.getUTCFullYear(), atual.getUTCMonth() + 1, 1))
        : new Date(atual.getTime() + 86_400_000);
  }
  return chaves;
}

const diasEntre = (inicio, fim) => Math.round((Date.parse(fim) - Date.parse(inicio)) / 86_400_000) + 1;

export async function obterMetricas({ inicio, fim } = {}) {
  const periodo = condicaoPeriodo({ inicio, fim });

  const [[totais], [itens], [canceladas], ranking, [primeira]] = await prisma.$transaction([
    prisma.$queryRaw`
      SELECT COALESCE(SUM(v.valor_total), 0) AS faturamento, COUNT(*)::int AS vendas
      FROM venda v
      WHERE v.status = 'CONCLUIDA' ${periodo}`,
    prisma.$queryRaw`
      SELECT COALESCE(SUM(i.custo_unitario * i.quantidade), 0) AS custo,
             COALESCE(SUM(CASE WHEN p.tipo = 'MARMITA' THEN i.quantidade ELSE 0 END), 0)::int AS marmitas
      FROM item_venda i
      JOIN venda v ON v.id = i.venda_id
      JOIN produto p ON p.id = i.produto_id
      WHERE v.status = 'CONCLUIDA' ${periodo}`,
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS quantidade, COALESCE(SUM(v.valor_total), 0) AS valor
      FROM venda v
      WHERE v.status = 'CANCELADA' ${periodo}`,
    prisma.$queryRaw`
      SELECT p.id AS "produtoId", p.nome, p.tipo::text AS tipo, p.imagem_url AS "imagemUrl", p.ativo,
             SUM(i.quantidade)::int AS quantidade,
             SUM(i.subtotal) AS faturamento,
             SUM(i.subtotal - i.custo_unitario * i.quantidade) AS lucro
      FROM item_venda i
      JOIN venda v ON v.id = i.venda_id
      JOIN produto p ON p.id = i.produto_id
      WHERE v.status = 'CONCLUIDA' ${periodo}
      GROUP BY p.id
      ORDER BY quantidade DESC, faturamento DESC, p.nome ASC`,
    prisma.$queryRaw`
      SELECT to_char(MIN(v.data_hora AT TIME ZONE ${FUSO}), 'YYYY-MM-DD') AS dia
      FROM venda v
      WHERE v.status = 'CONCLUIDA' ${periodo}`,
  ]);

  const faturamento = dec(totais.faturamento);
  const custo = dec(itens.custo);
  const lucro = faturamento.sub(custo);
  const numeroVendas = totais.vendas;

  const listaRanking = ranking.map((r) => {
    const fat = dec(r.faturamento);
    return {
      produtoId: r.produtoId,
      nome: r.nome,
      tipo: r.tipo,
      imagemUrl: r.imagemUrl,
      ativo: r.ativo,
      quantidade: r.quantidade,
      faturamento: texto(fat),
      lucro: texto(dec(r.lucro)),
      participacao: percentual(fat, faturamento),
    };
  });

  return {
    periodo: { inicio: inicio ?? null, fim: fim ?? null },
    faturamentoBruto: texto(faturamento),
    custoTotal: texto(custo),
    lucro: texto(lucro),
    margemLucro: percentual(lucro, faturamento),
    numeroVendas,
    ticketMedio: texto(numeroVendas > 0 ? faturamento.div(numeroVendas).toDecimalPlaces(2) : ZERO),
    marmitasVendidas: itens.marmitas,
    canceladas: { quantidade: canceladas.quantidade, valor: texto(dec(canceladas.valor)) },
    produtoMaisVendido: listaRanking[0] ?? null,
    ranking: listaRanking,
    ...(await montarSerie({ inicio, fim, primeiraVenda: primeira?.dia, periodo })),
  };
}

// Evolução de faturamento, lucro e nº de vendas por dia (até 92 dias) ou por mês, com zeros nos vazios.
async function montarSerie({ inicio, fim, primeiraVenda, periodo }) {
  const inicioSerie = inicio ?? primeiraVenda;
  const fimSerie = fim ?? hojeCuiaba();
  if (!inicioSerie) return { agrupamento: 'dia', serie: [] };

  const agrupamento = diasEntre(inicioSerie, fimSerie) > MAX_DIAS_SERIE_DIARIA ? 'mes' : 'dia';
  const unidade = agrupamento === 'mes' ? 'month' : 'day';

  const linhas = await prisma.$queryRaw`
    SELECT to_char(date_trunc(${unidade}, v.data_hora AT TIME ZONE ${FUSO}), 'YYYY-MM-DD') AS chave,
           SUM(v.valor_total) AS faturamento,
           SUM(c.custo) AS custo,
           COUNT(*)::int AS vendas
    FROM venda v
    JOIN (SELECT venda_id, SUM(custo_unitario * quantidade) AS custo FROM item_venda GROUP BY venda_id) c ON c.venda_id = v.id
    WHERE v.status = 'CONCLUIDA' ${periodo}
    GROUP BY 1
    ORDER BY 1`;

  const porChave = new Map(linhas.map((l) => [l.chave, l]));
  const serie = chavesDoIntervalo(inicioSerie, fimSerie, agrupamento).map((chave) => {
    const l = porChave.get(chave);
    const fat = dec(l?.faturamento);
    return {
      periodo: chave,
      faturamento: texto(fat),
      lucro: texto(fat.sub(dec(l?.custo))),
      vendas: l?.vendas ?? 0,
    };
  });

  return { agrupamento, serie };
}
