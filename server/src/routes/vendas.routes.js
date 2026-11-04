import { Router } from 'express';
import * as controller from '../controllers/vendas.controller.js';
import { validar } from '../middlewares/validar.js';
import { paramsId } from '../schemas/comuns.js';
import { vendaBody, vendaQuery, cancelarBody } from '../schemas/venda.schema.js';

export const rotasVendas = Router();

rotasVendas.post('/', validar({ body: vendaBody }), controller.registrar);
rotasVendas.get('/', validar({ query: vendaQuery }), controller.listar);
rotasVendas.get('/:id', validar({ params: paramsId }), controller.detalhar);
rotasVendas.patch('/:id/cancelar', validar({ params: paramsId, body: cancelarBody }), controller.cancelar);
