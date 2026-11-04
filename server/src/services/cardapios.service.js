// Cardápio do dia (RF010) e consulta de cardápios por data (RF012).
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/AppError.js';
import { hojeCuiaba } from '../lib/periodo.js';

// Limites para caber no layout A4 da imagem
export const LIMITES = { MARMITA: 4, PRATO: 4, PROTEINA: 6, ACOMPANHAMENTO: 10 };
const ROTULOS = { MARMITA: 'marmitas', PRATO: 'pratos', PROTEINA: 'proteínas', ACOMPANHAMENTO: 'acompanhamentos' };

// Regra: só o cardápio do dia (hoje, em Cuiabá) pode ser criado, alterado ou excluído.
// Cardápios de dias passados ficam apenas para consulta.
export function podeEditar(data) {
  return data === hojeCuiaba();
}

function garantirEditavel(data) {
  if (podeEditar(data)) return;
  const hoje = hojeCuiaba();
  throw new AppError(
    data < hoje
      ? 'Cardápio de dias anteriores não pode ser alterado; fica disponível apenas para consulta.'
      : 'Só é possível montar o cardápio de hoje.',
    409,
  );
}

// Coluna DATE: o Prisma usa a parte UTC da data
const paraBanco = (data) => new Date(`${data}T00:00:00.000Z`);
const doBanco = (d) => d.toISOString().slice(0, 10);

const incluirTudo = {
  produtos: { include: { produto: { select: { tipo: true } } }, orderBy: { ordem: 'asc' } },
  preparos: { include: { preparo: { select: { tipo: true } } }, orderBy: { ordem: 'asc' } },
};

function paraResposta(cardapio) {
  const data = doBanco(cardapio.data);
  const itens = (tipo) =>
    cardapio.produtos.filter((p) => p.produto.tipo === tipo).map((p) => ({ produtoId: p.produtoId, nome: p.nome, preco: p.preco.toFixed(2) }));
  const preparos = (tipo) => cardapio.preparos.filter((p) => p.preparo.tipo === tipo).map((p) => ({ preparoId: p.preparoId, nome: p.nome }));
  return {
    data,
    editavel: podeEditar(data),
    atualizadoEm: cardapio.atualizadoEm,
    marmitas: itens('MARMITA'),
    pratos: itens('PRATO'),
    proteinas: preparos('PROTEINA'),
    acompanhamentos: preparos('ACOMPANHAMENTO'),
  };
}

// Dias com cardápio salvo no intervalo (marcação do calendário)
export async function listarDias({ inicio, fim }) {
  const cardapios = await prisma.cardapio.findMany({
    where: { data: { gte: paraBanco(inicio), lte: paraBanco(fim) } },
    select: { data: true, _count: { select: { produtos: true, preparos: true } } },
    orderBy: { data: 'asc' },
  });
  return cardapios.map((c) => ({ data: doBanco(c.data), produtos: c._count.produtos, preparos: c._count.preparos }));
}

export async function obter(data) {
  const cardapio = await prisma.cardapio.findUnique({ where: { data: paraBanco(data) }, include: incluirTudo });
  if (!cardapio) throw new AppError('Não há cardápio salvo para este dia.', 404);
  return paraResposta(cardapio);
}

// Cria ou substitui o cardápio do dia em uma transação. Nome e preço são copiados neste momento.
export async function salvar(data, { produtoIds, preparoIds }) {
  garantirEditavel(data);
  if (produtoIds.length + preparoIds.length === 0) {
    throw new AppError('O cardápio precisa ter pelo menos um item.', 400);
  }

  const cardapio = await prisma.$transaction(async (tx) => {
    const [produtos, preparos] = await Promise.all([
      tx.produto.findMany({ where: { id: { in: produtoIds } } }),
      tx.preparo.findMany({ where: { id: { in: preparoIds } } }),
    ]);
    const produtoPorId = new Map(produtos.map((p) => [p.id, p]));
    const preparoPorId = new Map(preparos.map((p) => [p.id, p]));

    const problemas = [];
    for (const id of produtoIds) {
      const p = produtoPorId.get(id);
      if (!p) problemas.push(`produto id ${id} não encontrado`);
      else if (!p.ativo) problemas.push(`"${p.nome}" está inativo`);
      else if (p.tipo !== 'MARMITA' && p.tipo !== 'PRATO') problemas.push(`"${p.nome}" não é marmita nem prato`);
    }
    for (const id of preparoIds) {
      const p = preparoPorId.get(id);
      if (!p) problemas.push(`preparo id ${id} não encontrado`);
      else if (!p.ativo) problemas.push(`"${p.nome}" está inativo`);
    }
    if (problemas.length > 0) {
      throw new AppError(`Não foi possível salvar o cardápio: ${problemas.join('; ')}.`, 400);
    }

    const contagem = { MARMITA: 0, PRATO: 0, PROTEINA: 0, ACOMPANHAMENTO: 0 };
    produtos.forEach((p) => contagem[p.tipo]++);
    preparos.forEach((p) => contagem[p.tipo]++);
    const excedidos = Object.entries(LIMITES)
      .filter(([tipo, max]) => contagem[tipo] > max)
      .map(([tipo, max]) => `no máximo ${max} ${ROTULOS[tipo]}`);
    if (excedidos.length > 0) {
      throw new AppError(`O cardápio comporta ${excedidos.join(', ')}.`, 400);
    }

    const dataBanco = paraBanco(data);
    const existente = await tx.cardapio.upsert({
      where: { data: dataBanco },
      create: { data: dataBanco },
      update: { atualizadoEm: new Date() },
    });

    await tx.cardapioProduto.deleteMany({ where: { cardapioId: existente.id } });
    await tx.cardapioPreparo.deleteMany({ where: { cardapioId: existente.id } });

    await tx.cardapioProduto.createMany({
      data: produtoIds.map((id, ordem) => {
        const p = produtoPorId.get(id);
        return { cardapioId: existente.id, produtoId: id, nome: p.nome, preco: p.precoVenda, ordem };
      }),
    });
    await tx.cardapioPreparo.createMany({
      data: preparoIds.map((id, ordem) => ({ cardapioId: existente.id, preparoId: id, nome: preparoPorId.get(id).nome, ordem })),
    });

    return tx.cardapio.findUnique({ where: { id: existente.id }, include: incluirTudo });
  });

  return paraResposta(cardapio);
}

export async function excluir(data) {
  garantirEditavel(data);
  const { count } = await prisma.cardapio.deleteMany({ where: { data: paraBanco(data) } });
  if (count === 0) throw new AppError('Não há cardápio salvo para este dia.', 404);
}
