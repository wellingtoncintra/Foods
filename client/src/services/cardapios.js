import { api, ErroApi } from './api.js';

// Dias com cardápio salvo entre duas datas (para marcar o calendário)
export const listarDiasComCardapio = (inicio, fim) => api.get(`/cardapios?inicio=${inicio}&fim=${fim}`);

// Cardápio de um dia; devolve null quando não há cardápio salvo
export async function obterCardapio(data) {
  try {
    return await api.get(`/cardapios/${data}`);
  } catch (err) {
    if (err instanceof ErroApi && err.status === 404) return null;
    throw err;
  }
}

// Ordem das listas = ordem na imagem
export const salvarCardapio = (data, produtoIds, preparoIds) => api.put(`/cardapios/${data}`, { produtoIds, preparoIds });
export const excluirCardapio = (data) => api.delete(`/cardapios/${data}`);
