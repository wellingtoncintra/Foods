import { Router } from 'express';
import { verificarSaude } from '../controllers/health.controller.js';
import { metricas } from '../controllers/dashboard.controller.js';
import { validar } from '../middlewares/validar.js';
import { dashboardQuery } from '../schemas/dashboard.schema.js';
import { rotasProdutos } from './produtos.routes.js';
import { rotasVendas } from './vendas.routes.js';
import { rotasPreparos } from './preparos.routes.js';
import { rotasCardapios } from './cardapios.routes.js';

export const rotas = Router();

rotas.get('/health', verificarSaude);
rotas.use('/produtos', rotasProdutos);
rotas.use('/vendas', rotasVendas);
rotas.get('/dashboard', validar({ query: dashboardQuery }), metricas);
rotas.use('/preparos', rotasPreparos);
rotas.use('/cardapios', rotasCardapios);
