// Cadastro de preparos: proteínas e acompanhamentos do cardápio (RF011).
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/AppError.js';

const comUso = { _count: { select: { cardapios: true } } };

function paraResposta(preparo) {
  const { _count, ...resto } = preparo;
  const usadoEmCardapio = (_count?.cardapios ?? 0) > 0;
  return { ...resto, usadoEmCardapio, podeExcluir: !usadoEmCardapio };
}

async function buscarOuFalhar(id) {
  const preparo = await prisma.preparo.findUnique({ where: { id }, include: comUso });
  if (!preparo) throw new AppError('Preparo não encontrado.', 404);
  return preparo;
}

// Nome repetido não é permitido (sem diferenciar maiúsculas/minúsculas).
async function garantirNomeUnico(nome, idIgnorado) {
  const existente = await prisma.preparo.findFirst({
    where: { nome: { equals: nome, mode: 'insensitive' }, ...(idIgnorado ? { NOT: { id: idIgnorado } } : {}) },
    select: { id: true },
  });
  if (existente) {
    const mensagem = `Já existe um preparo com o nome "${nome}".`;
    throw new AppError(mensagem, 409, [{ campo: 'nome', mensagem }]);
  }
}

export async function listar({ ativo, tipo } = {}) {
  const preparos = await prisma.preparo.findMany({
    where: { ativo, tipo },
    include: comUso,
    orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
  });
  return preparos.map(paraResposta);
}

export async function detalhar(id) {
  return paraResposta(await buscarOuFalhar(id));
}

export async function cadastrar(dados) {
  await garantirNomeUnico(dados.nome);
  return paraResposta(await prisma.preparo.create({ data: dados, include: comUso }));
}

// Renomear não altera cardápios antigos: cada cardápio guarda o nome como foi divulgado.
export async function alterar(id, dados) {
  await buscarOuFalhar(id);
  await garantirNomeUnico(dados.nome, id);
  return paraResposta(await prisma.preparo.update({ where: { id }, data: dados, include: comUso }));
}

export async function alterarSituacao(id, ativo) {
  await buscarOuFalhar(id);
  return paraResposta(await prisma.preparo.update({ where: { id }, data: { ativo }, include: comUso }));
}

// Preparo que já apareceu em algum cardápio não pode ser apagado; deve ser desativado.
export async function excluir(id) {
  const preparo = await buscarOuFalhar(id);
  if (preparo._count.cardapios > 0) {
    throw new AppError('Este preparo já foi usado em cardápios e não pode ser excluído. Desative-o.', 409);
  }
  await prisma.preparo.delete({ where: { id } });
}
