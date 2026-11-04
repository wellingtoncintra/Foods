import { Router } from 'express';
import * as controller from '../controllers/preparos.controller.js';
import { validar } from '../middlewares/validar.js';
import { paramsId } from '../schemas/comuns.js';
import { situacaoBody } from '../schemas/produto.schema.js';
import { preparoBody, preparoQuery } from '../schemas/preparo.schema.js';

export const rotasPreparos = Router();

rotasPreparos.get('/', validar({ query: preparoQuery }), controller.listar);
rotasPreparos.get('/:id', validar({ params: paramsId }), controller.detalhar);
rotasPreparos.post('/', validar({ body: preparoBody }), controller.cadastrar);
rotasPreparos.put('/:id', validar({ params: paramsId, body: preparoBody }), controller.alterar);
rotasPreparos.patch('/:id/situacao', validar({ params: paramsId, body: situacaoBody }), controller.alterarSituacao);
rotasPreparos.delete('/:id', validar({ params: paramsId }), controller.excluir);
