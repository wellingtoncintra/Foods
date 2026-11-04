// Erro de regra de negócio com status HTTP e mensagem clara para o usuário (NF003).
export class AppError extends Error {
  constructor(mensagem, status = 400, detalhes = undefined) {
    super(mensagem);
    this.name = 'AppError';
    this.status = status;
    this.detalhes = detalhes;
  }
}
