import * as servico from '../services/vendas.service.js';

export async function registrar(req, res) {
  res.status(201).json(await servico.registrar(req.dados.body.itens));
}

export async function listar(req, res) {
  res.json(await servico.listar(req.dados.query));
}

export async function detalhar(req, res) {
  res.json(await servico.detalhar(req.dados.params.id));
}

export async function cancelar(req, res) {
  res.json(await servico.cancelar(req.dados.params.id, req.dados.body.motivo));
}
