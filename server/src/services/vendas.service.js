// Regras de negócio de vendas (RF004, RF005, RF006).
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/AppError.js';
import { filtroPeriodo } from '../lib/periodo.js';

const incluirItens = {
  itens: {
    include: { produto: { select: { nome: true, tipo: true } } },
    orderBy: { id: 'asc' },
  },
};

// Formato devolvido pela API. Decimais saem como texto ("18.00").
function paraResposta(venda) {
  return {
    id: venda.id,
    dataHora: venda.dataHora,
    valorTotal: venda.valorTotal.toFixed(2),
    status: venda.status,
    canceladaEm: venda.canceladaEm,
    motivoCancelamento: venda.motivoCancelamento,
    itens: venda.itens.map((i) => ({
      id: i.id,
      produtoId: i.produtoId,
      produtoNome: i.produto.nome,
      produtoTipo: i.produto.tipo,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario.toFixed(2),
      custoUnitario: i.custoUnitario.toFixed(2),
      subtotal: i.subtotal.toFixed(2),
    })),
  };
}

// Junta itens repetidos do mesmo produto somando as quantidades.
function agruparItens(itens) {
  const porProduto = new Map();
  for (const { produtoId, quantidade } of itens) {
    porProduto.set(produtoId, (porProduto.get(produtoId) ?? 0) + quantidade);
  }
  return [...porProduto].map(([produtoId, quantidade]) => ({ produtoId, quantidade }));
}

// RF004 + RF005: registra a venda em uma única transação (regra 3 / NF006).
// Preço e custo são copiados do produto neste momento (regra 2); o total é calculado aqui (regra 1).
export async function registrar(itensRecebidos) {
  const itens = agruparItens(itensRecebidos);
  try {
    const venda = await prisma.$transaction((tx) => gravarVenda(tx, itens));
    return paraResposta(venda);
  } catch (err) {
    if (err instanceof AppError) throw err;
    // UC002 cenário 8.1: a transação desfez tudo; informa que a venda não foi concluída
    console.error('Falha ao registrar venda:', err);
    throw new AppError('A venda não pôde ser concluída e nada foi registrado. Tente novamente.', 500);
  }
}

// Executada dentro da transação: qualquer erro aqui desfaz a venda inteira.
async function gravarVenda(tx, itens) {
  const ids = itens.map((i) => i.produtoId);
  const produtos = await tx.produto.findMany({ where: { id: { in: ids } } });
  const porId = new Map(produtos.map((p) => [p.id, p]));

  const inexistentes = ids.filter((id) => !porId.has(id));
  if (inexistentes.length > 0) {
    throw new AppError(`Produto não encontrado (id ${inexistentes.join(', ')}). Atualize a tela e tente novamente.`, 400);
  }

  const inativos = produtos.filter((p) => !p.ativo);
  if (inativos.length > 0) {
    const nomes = inativos.map((p) => `"${p.nome}"`).join(', ');
    throw new AppError(`Produto inativo não pode ser vendido: ${nomes}. Atualize a tela e tente novamente.`, 409);
  }

  let valorTotal = new Prisma.Decimal(0);
  const linhas = itens.map(({ produtoId, quantidade }) => {
    const produto = porId.get(produtoId);
    const subtotal = produto.precoVenda.mul(quantidade);
    valorTotal = valorTotal.add(subtotal);
    return {
      produtoId,
      quantidade,
      precoUnitario: produto.precoVenda,
      custoUnitario: produto.custoMedio,
      subtotal,
    };
  });

  return tx.venda.create({
    data: { valorTotal, itens: { create: linhas } },
    include: incluirItens,
  });
}

// RF006: histórico com filtros de período (fuso de Cuiabá) e status, paginado.
export async function listar({ inicio, fim, status, pagina, limite }) {
  const where = { dataHora: filtroPeriodo({ inicio, fim }), status };

  const [total, vendas] = await prisma.$transaction([
    prisma.venda.count({ where }),
    prisma.venda.findMany({
      where,
      include: incluirItens,
      orderBy: [{ dataHora: 'desc' }, { id: 'desc' }],
      skip: (pagina - 1) * limite,
      take: limite,
    }),
  ]);

  return {
    vendas: vendas.map(paraResposta),
    total,
    pagina,
    limite,
    totalPaginas: Math.max(1, Math.ceil(total / limite)),
  };
}

export async function detalhar(id) {
  const venda = await prisma.venda.findUnique({ where: { id }, include: incluirItens });
  if (!venda) throw new AppError('Venda não encontrada.', 404);
  return paraResposta(venda);
}

// Cancelamento: a venda não é apagada (regra 7). É definitivo — venda cancelada não volta a ser concluída.
export async function cancelar(id, motivo) {
  // updateMany com status no filtro evita cancelar duas vezes em requisições simultâneas
  const { count } = await prisma.venda.updateMany({
    where: { id, status: 'CONCLUIDA' },
    data: { status: 'CANCELADA', canceladaEm: new Date(), motivoCancelamento: motivo },
  });

  if (count === 0) {
    const existente = await prisma.venda.findUnique({ where: { id }, select: { id: true } });
    if (!existente) throw new AppError('Venda não encontrada.', 404);
    throw new AppError('Esta venda já está cancelada.', 409);
  }

  return detalhar(id);
}
