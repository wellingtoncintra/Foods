// Cliente HTTP da API. Em desenvolvimento, o Vite redireciona /api para o servidor.

export class ErroApi extends Error {
  constructor(mensagem, status, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

async function requisitar(caminho, opcoes = {}) {
  const ehFormData = opcoes.body instanceof FormData;
  const resposta = await fetch(`/api${caminho}`, {
    ...opcoes,
    headers: ehFormData ? opcoes.headers : { 'Content-Type': 'application/json', ...opcoes.headers },
    body: ehFormData || opcoes.body === undefined ? opcoes.body : JSON.stringify(opcoes.body),
  });

  const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ErroApi(dados?.erro ?? 'Não foi possível concluir a operação.', resposta.status, dados?.detalhes);
  }
  return dados;
}

export const api = {
  get: (caminho) => requisitar(caminho),
  post: (caminho, body) => requisitar(caminho, { method: 'POST', body }),
  put: (caminho, body) => requisitar(caminho, { method: 'PUT', body }),
  patch: (caminho, body) => requisitar(caminho, { method: 'PATCH', body }),
  delete: (caminho) => requisitar(caminho, { method: 'DELETE' }),
};

export const verificarSaude = () => api.get('/health');
