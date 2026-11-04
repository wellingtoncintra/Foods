import { obterMetricas } from '../services/dashboard.service.js';

export async function metricas(req, res) {
  res.json(await obterMetricas(req.dados.query));
}
