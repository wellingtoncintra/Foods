import { z } from 'zod';
import { dataValida } from '../lib/periodo.js';

export const QUANTIDADE_MAXIMA_ITEM = 999;

// Corpo de POST /api/vendas. Campos extras (ex.: valorTotal, precoUnitario) são descartados:
// o total é sempre recalculado no servidor (regra 1).
export const vendaBody = z.object({
  itens: z
    .array(
      z.object({
        produtoId: z.number({ error: 'Produto inválido.' }).int('Produto inválido.').positive('Produto inválido.'),
        quantidade: z
          .number({ error: 'Quantidade deve ser um número inteiro.' })
          .int('Quantidade deve ser um número inteiro.')
          .positive('Quantidade deve ser maior que zero.')
          .max(QUANTIDADE_MAXIMA_ITEM, `Quantidade máxima por item é ${QUANTIDADE_MAXIMA_ITEM}.`),
      }),
      { error: 'Informe os itens da venda.' },
    )
    .min(1, 'Selecione pelo menos um produto para registrar a venda.'),
});

const data = (rotulo) =>
  z
    .string()
    .refine(dataValida, `${rotulo} deve ser uma data válida no formato AAAA-MM-DD.`)
    .optional();

// Query de GET /api/vendas
export const vendaQuery = z
  .object({
    inicio: data('Data inicial'),
    fim: data('Data final'),
    status: z.enum(['CONCLUIDA', 'CANCELADA'], { error: 'Status deve ser CONCLUIDA ou CANCELADA.' }).optional(),
    pagina: z.coerce.number().int().min(1, 'Página inválida.').default(1),
    limite: z.coerce.number().int().min(1).max(100, 'Limite máximo é 100.').default(20),
  })
  .refine((q) => !q.inicio || !q.fim || q.inicio <= q.fim, {
    message: 'A data inicial não pode ser posterior à data final.',
    path: ['inicio'],
  });

// Corpo de PATCH /api/vendas/:id/cancelar (motivo opcional)
export const cancelarBody = z.object({
  motivo: z
    .string()
    .trim()
    .max(255, 'O motivo deve ter no máximo 255 caracteres.')
    .nullish()
    .transform((v) => (v ? v : null)),
});
