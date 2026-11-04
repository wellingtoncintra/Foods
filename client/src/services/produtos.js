import { api } from './api.js';

export const listarProdutos = (filtros = {}) => {
  const params = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== ''));
  const qs = params.toString();
  return api.get(`/produtos${qs ? `?${qs}` : ''}`);
};

export const detalharProduto = (id) => api.get(`/produtos/${id}`);
export const cadastrarProduto = (dados) => api.post('/produtos', dados);
export const alterarProduto = (id, dados) => api.put(`/produtos/${id}`, dados);
export const alterarSituacaoProduto = (id, ativo) => api.patch(`/produtos/${id}/situacao`, { ativo });
export const excluirProduto = (id) => api.delete(`/produtos/${id}`);
export const removerFotoProduto = (id) => api.delete(`/produtos/${id}/imagem`);

export function enviarFotoProduto(id, arquivo) {
  const form = new FormData();
  form.append('imagem', arquivo);
  return api.post(`/produtos/${id}/imagem`, form);
}
