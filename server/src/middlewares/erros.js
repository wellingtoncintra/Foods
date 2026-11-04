import { ZodError } from 'zod';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/AppError.js';

// Rota inexistente dentro de /api
export function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

// Tratamento centralizado de erros. Sempre responde { erro, detalhes? }.
// eslint-disable-next-line no-unused-vars
export function tratarErros(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ erro: err.message, detalhes: err.detalhes });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      erro: 'Dados inválidos.',
      detalhes: err.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
    });
  }

  if (err instanceof multer.MulterError) {
    const mensagens = {
      LIMIT_FILE_SIZE: 'A foto deve ter no máximo 2 MB.',
      LIMIT_UNEXPECTED_FILE: 'Envie a foto no campo "imagem" (apenas um arquivo).',
      LIMIT_FILE_COUNT: 'Envie apenas um arquivo.',
    };
    const mensagem = mensagens[err.code] ?? 'Erro no envio do arquivo.';
    return res.status(400).json({ erro: mensagem });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return res.status(404).json({ erro: 'Registro não encontrado.' });
    if (err.code === 'P2002') return res.status(409).json({ erro: 'Já existe um registro com esses dados.' });
    if (err.code === 'P2003') {
      return res.status(409).json({ erro: 'Operação não permitida: o registro está vinculado a outros dados.' });
    }
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }

  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor. Tente novamente.' });
}
