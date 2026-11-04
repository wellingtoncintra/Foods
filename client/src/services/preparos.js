import { api } from './api.js';

export const listarPreparos = (filtros = {}) => {
  const params = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== ''));
  const qs = params.toString();
  return api.get(`/preparos${qs ? `?${qs}` : ''}`);
};

export const cadastrarPreparo = (dados) => api.post('/preparos', dados);
export const alterarPreparo = (id, dados) => api.put(`/preparos/${id}`, dados);
export const alterarSituacaoPreparo = (id, ativo) => api.patch(`/preparos/${id}/situacao`, { ativo });
export const excluirPreparo = (id) => api.delete(`/preparos/${id}`);
