import * as servico from '../services/cardapios.service.js';

export async function listarDias(req, res) {
  res.json(await servico.listarDias(req.dados.query));
}

export async function obter(req, res) {
  res.json(await servico.obter(req.dados.params.data));
}

export async function salvar(req, res) {
  res.json(await servico.salvar(req.dados.params.data, req.dados.body));
}

export async function excluir(req, res) {
  await servico.excluir(req.dados.params.data);
  res.status(204).end();
}
