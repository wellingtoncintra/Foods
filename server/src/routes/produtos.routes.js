import { Router } from 'express';
import * as controller from '../controllers/produtos.controller.js';
import { validar } from '../middlewares/validar.js';
import { uploadFotoProduto } from '../middlewares/upload.js';
import { paramsId } from '../schemas/comuns.js';
import { produtoBody, produtoQuery, situacaoBody } from '../schemas/produto.schema.js';

export const rotasProdutos = Router();

rotasProdutos.get('/', validar({ query: produtoQuery }), controller.listar);
rotasProdutos.get('/:id', validar({ params: paramsId }), controller.detalhar);
rotasProdutos.post('/', validar({ body: produtoBody }), controller.cadastrar);
rotasProdutos.put('/:id', validar({ params: paramsId, body: produtoBody }), controller.alterar);
rotasProdutos.patch('/:id/situacao', validar({ params: paramsId, body: situacaoBody }), controller.alterarSituacao);
rotasProdutos.delete('/:id', validar({ params: paramsId }), controller.excluir);
rotasProdutos.post('/:id/imagem', validar({ params: paramsId }), uploadFotoProduto, controller.definirFoto);
rotasProdutos.delete('/:id/imagem', validar({ params: paramsId }), controller.removerFoto);
