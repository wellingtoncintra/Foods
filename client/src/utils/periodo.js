// Datas e períodos no fuso da marmitaria (America/Cuiaba), independente do fuso do computador.

export const FUSO = 'America/Cuiaba';

const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' });
const formatoDataHora = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, dateStyle: 'short', timeStyle: 'short' });
const formatoHora = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' });
const formatoData = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, dateStyle: 'short' });

// Data (AAAA-MM-DD) de um instante no fuso de Cuiabá
export const diaCuiaba = (instante = new Date()) => formatoDia.format(new Date(instante));

export const hoje = () => diaCuiaba();

// "2026-11-03" + 1 → "2026-11-04"
export function somarDias(data, dias) {
  const [a, m, d] = data.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

export const PERIODOS_RAPIDOS = [
  { chave: 'hoje', rotulo: 'Hoje' },
  { chave: '7dias', rotulo: '7 dias' },
  { chave: '15dias', rotulo: '15 dias' },
  { chave: 'mes', rotulo: 'Mês corrente' },
  { chave: 'tudo', rotulo: 'Tudo' },
  { chave: 'personalizado', rotulo: 'Personalizado' },
];

// Intervalo { inicio, fim } (inclusivos) de um período rápido. "tudo" → sem limites.
export function intervaloDoPeriodo(chave) {
  const h = hoje();
  switch (chave) {
    case 'hoje':
      return { inicio: h, fim: h };
    case '7dias':
      return { inicio: somarDias(h, -6), fim: h };
    case '15dias':
      return { inicio: somarDias(h, -14), fim: h };
    case 'mes':
      return { inicio: `${h.slice(0, 8)}01`, fim: h };
    default:
      return {};
  }
}

export const dataHora = (iso) => formatoDataHora.format(new Date(iso));
export const hora = (iso) => formatoHora.format(new Date(iso));
export const data = (iso) => formatoData.format(new Date(iso));

// "2026-11-04" → "Quarta-feira" (a data já é um dia local; calcula em UTC para não mudar de dia)
export function diaDaSemana(data) {
  const [a, m, d] = data.split('-').map(Number);
  const nome = new Date(Date.UTC(a, m - 1, d)).toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'long' });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

// "2026-11-04" → "04/11/2026"
export const dataCurta = (data) => data.split('-').reverse().join('/');

// Hora se for hoje; data e hora se for outro dia
export const quando = (iso) => (diaCuiaba(iso) === hoje() ? `Hoje, ${hora(iso)}` : dataHora(iso));
