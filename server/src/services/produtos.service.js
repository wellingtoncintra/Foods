// Regras de negócio de produtos (RF001, RF002, RF003).
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/AppError.js';
import { PASTA_UPLOADS, PREFIXO_URL_UPLOADS } from '../lib/caminhos.js';

const comContagemDeVendas = { _count: { select: { itens: true, cardapios: true } } };

// Formato devolvido pela API. Decimais saem como texto ("18.00") para não perder precisão.
function paraResposta(produto) {
  const { _count, precoVenda, custoMedio, ...resto } = produto;
  return {
    ...resto,
    precoVenda: precoVenda.toFixed(2),
    custoMedio: custoMedio.toFixed(2),
    possuiVendas: (_count?.itens ?? 0) > 0,
    usadoEmCardapio: (_count?.cardapios ?? 0) > 0,
    podeExcluir: (_count?.itens ?? 0) === 0 && (_count?.cardapios ?? 0) === 0,
  };
}

async function buscarOuFalhar(id) {
  const produto = await prisma.produto.findUnique({ where: { id }, include: comContagemDeVendas });
  if (!produto) throw new AppError('Produto não encontrado.', 404);
  return produto;
}

// Nome repetido não é permitido (sem diferenciar maiúsculas/minúsculas).
async function garantirNomeUnico(nome, idIgnorado) {
  const existente = await prisma.produto.findFirst({
    where: { nome: { equals: nome, mode: 'insensitive' }, ...(idIgnorado ? { NOT: { id: idIgnorado } } : {}) },
    select: { id: true },
  });
  if (existente) {
    const mensagem = `Já existe um produto com o nome "${nome}".`;
    throw new AppError(mensagem, 409, [{ campo: 'nome', mensagem }]);
  }
}

// Apaga o arquivo da foto. Falha ao apagar não interrompe a operação.
async function apagarArquivoFoto(imagemUrl) {
  if (!imagemUrl?.startsWith(`${PREFIXO_URL_UPLOADS}/`)) return;
  const arquivo = path.join(PASTA_UPLOADS, path.basename(imagemUrl));
  await fs.unlink(arquivo).catch((err) => {
    if (err.code !== 'ENOENT') console.warn(`Não foi possível apagar ${arquivo}:`, err.message);
  });
}

export async function listar({ ativo, tipo } = {}) {
  const produtos = await prisma.produto.findMany({
    where: { ativo, tipo },
    include: comContagemDeVendas,
    orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
  });
  return produtos.map(paraResposta);
}

export async function detalhar(id) {
  return paraResposta(await buscarOuFalhar(id));
}

export async function cadastrar(dados) {
  await garantirNomeUnico(dados.nome);
  const produto = await prisma.produto.create({ data: dados, include: comContagemDeVendas });
  return paraResposta(produto);
}

// Alterar o produto não muda vendas antigas: cada item de venda guarda o próprio preço e custo.
export async function alterar(id, dados) {
  await buscarOuFalhar(id);
  await garantirNomeUnico(dados.nome, id);
  const produto = await prisma.produto.update({ where: { id }, data: dados, include: comContagemDeVendas });
  return paraResposta(produto);
}

export async function alterarSituacao(id, ativo) {
  await buscarOuFalhar(id);
  const produto = await prisma.produto.update({ where: { id }, data: { ativo }, include: comContagemDeVendas });
  return paraResposta(produto);
}

// Produto com vendas ou presente em cardápios salvos não pode ser apagado (preserva o histórico); deve ser desativado.
export async function excluir(id) {
  const produto = await buscarOuFalhar(id);
  if (produto._count.itens > 0) {
    throw new AppError('Este produto possui vendas registradas e não pode ser excluído. Desative-o.', 409);
  }
  if (produto._count.cardapios > 0) {
    throw new AppError('Este produto aparece em cardápios salvos e não pode ser excluído. Desative-o.', 409);
  }
  await prisma.produto.delete({ where: { id } });
  await apagarArquivoFoto(produto.imagemUrl);
}

// Salva a foto enviada e apaga a anterior. Se o produto não existir, apaga o arquivo recém-enviado.
export async function definirFoto(id, arquivo) {
  if (!arquivo) throw new AppError('Nenhuma foto enviada. Envie a imagem no campo "imagem".', 400);
  const novaUrl = `${PREFIXO_URL_UPLOADS}/${arquivo.filename}`;

  let anterior;
  try {
    anterior = await buscarOuFalhar(id);
  } catch (err) {
    await apagarArquivoFoto(novaUrl);
    throw err;
  }

  const produto = await prisma.produto.update({ where: { id }, data: { imagemUrl: novaUrl }, include: comContagemDeVendas });
  await apagarArquivoFoto(anterior.imagemUrl);
  return paraResposta(produto);
}

export async function removerFoto(id) {
  const anterior = await buscarOuFalhar(id);
  const produto = await prisma.produto.update({ where: { id }, data: { imagemUrl: null }, include: comContagemDeVendas });
  await apagarArquivoFoto(anterior.imagemUrl);
  return paraResposta(produto);
}
