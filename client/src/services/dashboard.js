import { api } from './api.js';

// Métricas do período (inicio/fim "AAAA-MM-DD", inclusivos; sem datas = tudo)
export function obterDashboard({ inicio, fim } = {}) {
  const params = new URLSearchParams();
  if (inicio) params.set('inicio', inicio);
  if (fim) params.set('fim', fim);
  const qs = params.toString();
  return api.get(`/dashboard${qs ? `?${qs}` : ''}`);
}
