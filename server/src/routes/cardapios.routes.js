import { Router } from 'express';
import * as controller from '../controllers/cardapios.controller.js';
import { validar } from '../middlewares/validar.js';
import { cardapioBody, cardapioQuery, paramsData } from '../schemas/cardapio.schema.js';

export const rotasCardapios = Router();

rotasCardapios.get('/', validar({ query: cardapioQuery }), controller.listarDias);
rotasCardapios.get('/:data', validar({ params: paramsData }), controller.obter);
rotasCardapios.put('/:data', validar({ params: paramsData, body: cardapioBody }), controller.salvar);
rotasCardapios.delete('/:data', validar({ params: paramsData }), controller.excluir);
