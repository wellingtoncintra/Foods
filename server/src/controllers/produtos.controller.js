import * as servico from '../services/produtos.service.js';

export async function listar(req, res) {
  res.json(await servico.listar(req.dados.query));
}

export async function detalhar(req, res) {
  res.json(await servico.detalhar(req.dados.params.id));
}

export async function cadastrar(req, res) {
  res.status(201).json(await servico.cadastrar(req.dados.body));
}

export async function alterar(req, res) {
  res.json(await servico.alterar(req.dados.params.id, req.dados.body));
}

export async function alterarSituacao(req, res) {
  res.json(await servico.alterarSituacao(req.dados.params.id, req.dados.body.ativo));
}

export async function excluir(req, res) {
  await servico.excluir(req.dados.params.id);
  res.status(204).end();
}

export async function definirFoto(req, res) {
  res.json(await servico.definirFoto(req.dados.params.id, req.file));
}

export async function removerFoto(req, res) {
  res.json(await servico.removerFoto(req.dados.params.id));
}
