// Utilitários de formatação. A API envia valores como texto ("18.50");
// os cálculos de exibição usam centavos inteiros para evitar erros de float.

export const TIPOS_PRODUTO = [
  { valor: 'MARMITA', rotulo: 'Marmita' },
  { valor: 'PRATO', rotulo: 'Prato' },
  { valor: 'BEBIDA', rotulo: 'Bebida' },
  { valor: 'OUTRO', rotulo: 'Outro' },
];

export const rotuloTipo = (valor) => TIPOS_PRODUTO.find((t) => t.valor === valor)?.rotulo ?? valor;

// "18,50" | "18.50" → "18.50"; devolve null se não for um valor válido (até 2 casas)
export function normalizarValor(texto) {
  const v = String(texto ?? '').trim().replace(',', '.');
  return /^\d{1,8}(\.\d{1,2})?$/.test(v) ? v : null;
}

// "18.50" → 1850; "-1.50" → -150 (lucro pode ser negativo)
export function paraCentavos(valor) {
  const texto = String(valor ?? '').trim();
  const negativo = texto.startsWith('-');
  const normalizado = normalizarValor(negativo ? texto.slice(1) : texto);
  if (normalizado === null) return null;
  const [inteiro, decimal = ''] = normalizado.split('.');
  const centavos = Number(inteiro) * 100 + Number(decimal.padEnd(2, '0'));
  return negativo ? -centavos : centavos;
}

// 1850 → "R$ 18,50"
export function moedaDeCentavos(centavos) {
  const sinal = centavos < 0 ? '-' : '';
  const abs = Math.abs(centavos);
  const reais = Math.floor(abs / 100).toLocaleString('pt-BR');
  return `${sinal}R$ ${reais},${String(abs % 100).padStart(2, '0')}`;
}

// "18.50" → "R$ 18,50"
export const moeda = (valor) => {
  const c = paraCentavos(valor);
  return c === null ? '—' : moedaDeCentavos(c);
};

// "18.50" → "18,50" (para preencher campos de formulário)
export const valorParaCampo = (valor) => String(valor ?? '').replace('.', ',');
