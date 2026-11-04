import { api } from './api.js';

// Envia apenas produto e quantidade: o total é calculado pelo servidor.
export const registrarVenda = (itens) =>
  api.post('/vendas', { itens: itens.map(({ produtoId, quantidade }) => ({ produtoId, quantidade })) });

export function listarVendas(filtros = {}) {
  const params = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const qs = params.toString();
  return api.get(`/vendas${qs ? `?${qs}` : ''}`);
}

export const detalharVenda = (id) => api.get(`/vendas/${id}`);
export const cancelarVenda = (id, motivo) => api.patch(`/vendas/${id}/cancelar`, { motivo: motivo || null });
