import { dataCurta } from '../../utils/periodo.js';

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const pad = (n) => String(n).padStart(2, '0');

// Calendário mensal: marca os dias com cardápio salvo. Dias futuros ficam desabilitados.
// mes = { ano, mes } (mes de 0 a 11); datas no formato "AAAA-MM-DD".
export default function Calendario({ mes, diasComCardapio, selecionada, hoje, aoSelecionar, aoMudarMes, carregando }) {
  const { ano, mes: m } = mes;
  const primeiroDiaSemana = new Date(Date.UTC(ano, m, 1)).getUTCDay();
  const diasNoMes = new Date(Date.UTC(ano, m + 1, 0)).getUTCDate();
  const nomeMesBruto = new Date(Date.UTC(ano, m, 1)).toLocaleDateString('pt-BR', { timeZone: 'UTC', month: 'long', year: 'numeric' });
  const nomeMes = nomeMesBruto.charAt(0).toUpperCase() + nomeMesBruto.slice(1); // "Novembro de 2026"

  const mesDeHoje = hoje.slice(0, 7);
  const mesAtual = `${ano}-${pad(m + 1)}`;
  const podeAvancar = mesAtual < mesDeHoje;

  const mudar = (delta) => {
    const d = new Date(Date.UTC(ano, m + delta, 1));
    aoMudarMes({ ano: d.getUTCFullYear(), mes: d.getUTCMonth() });
  };

  const celulas = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(<span key={`v${i}`} />);
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const data = `${mesAtual}-${pad(dia)}`;
    const futuro = data > hoje;
    const tem = diasComCardapio.has(data);
    const classes = ['calendario-dia', tem && 'com-cardapio', data === hoje && 'hoje', data === selecionada && 'selecionado'].filter(Boolean).join(' ');
    celulas.push(
      <button
        key={data}
        type="button"
        className={classes}
        disabled={futuro}
        onClick={() => aoSelecionar(data)}
        aria-label={`${dataCurta(data)}${tem ? ', com cardápio' : ''}${data === hoje ? ', hoje' : ''}`}
        aria-pressed={data === selecionada}
      >
        {dia}
      </button>,
    );
  }

  return (
    <section className="card">
      <div className="calendario-topo">
        <button type="button" className="botao-icone" onClick={() => mudar(-1)} aria-label="Mês anterior">
          ‹
        </button>
        <span className="calendario-mes">
          {nomeMes}
          {carregando ? '…' : ''}
        </span>
        <button type="button" className="botao-icone" onClick={() => mudar(1)} disabled={!podeAvancar} aria-label="Próximo mês">
          ›
        </button>
      </div>
      <div className="calendario-grade">
        {SEMANA.map((s, i) => (
          <span key={i} className="calendario-semana">
            {s}
          </span>
        ))}
        {celulas}
      </div>
      <div className="calendario-legenda">
        <span>
          <span className="amostra-dia com-cardapio" /> Com cardápio
        </span>
        <span>
          <span className="amostra-dia hoje" /> Hoje
        </span>
      </div>
    </section>
  );
}
