import { z } from 'zod';
import { dataValida } from '../lib/periodo.js';

const data = (rotulo) => z.string({ error: `${rotulo} é obrigatória.` }).refine(dataValida, `${rotulo} deve ser uma data válida no formato AAAA-MM-DD.`);

// /api/cardapios/:data
export const paramsData = z.object({ data: data('Data') });

const listaIds = (rotulo) =>
  z
    .array(z.number({ error: `${rotulo}: id inválido.` }).int(`${rotulo}: id inválido.`).positive(`${rotulo}: id inválido.`), {
      error: `Informe a lista de ${rotulo.toLowerCase()}.`,
    })
    .max(50)
    .refine((ids) => new Set(ids).size === ids.length, `${rotulo}: item repetido na lista.`);

// Corpo de PUT /api/cardapios/:data — a ordem das listas é a ordem de exibição na imagem
export const cardapioBody = z.object({
  produtoIds: listaIds('Produtos'),
  preparoIds: listaIds('Preparos'),
});

// Query de GET /api/cardapios (dias com cardápio, para o calendário)
export const cardapioQuery = z
  .object({ inicio: data('Data inicial'), fim: data('Data final') })
  .refine((q) => q.inicio <= q.fim, { message: 'A data inicial não pode ser posterior à data final.', path: ['inicio'] })
  .refine((q) => Date.parse(q.fim) - Date.parse(q.inicio) <= 400 * 86_400_000, {
    message: 'O intervalo máximo é de 400 dias.',
    path: ['fim'],
  });
