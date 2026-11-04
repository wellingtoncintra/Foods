import { PERIODOS_RAPIDOS, intervaloDoPeriodo, hoje } from '../utils/periodo.js';

// Seletor de período: Hoje, 7 dias, 15 dias, Mês corrente, Tudo ou Personalizado (de/até).
// valor = { chave, inicio, fim }. Reutilizado no Histórico e no Dashboard.
export function periodoInicial(chave = 'hoje') {
  return { chave, ...intervaloDoPeriodo(chave) };
}

export default function SeletorPeriodo({ valor, aoAlterar }) {
  function escolher(chave) {
    if (chave === 'personalizado') {
      const h = hoje();
      aoAlterar({ chave, inicio: valor.inicio ?? h, fim: valor.fim ?? h });
    } else {
      aoAlterar(periodoInicial(chave));
    }
  }

  const alterarData = (campo) => (e) => {
    const nova = { ...valor, [campo]: e.target.value };
    if (nova.inicio && nova.fim) aoAlterar(nova);
  };

  const invalido = valor.chave === 'personalizado' && valor.inicio > valor.fim;

  return (
    <div className="seletor-periodo">
      <div className="chips" role="group" aria-label="Período">
        {PERIODOS_RAPIDOS.map((p) => (
          <button key={p.chave} type="button" className={`chip ${valor.chave === p.chave ? 'chip-ativo' : ''}`} onClick={() => escolher(p.chave)}>
            {p.rotulo}
          </button>
        ))}
      </div>

      {valor.chave === 'personalizado' && (
        <div className="periodo-datas">
          <label>
            De
            <input type="date" value={valor.inicio} max={valor.fim} onChange={alterarData('inicio')} />
          </label>
          <label>
            até
            <input type="date" value={valor.fim} min={valor.inicio} onChange={alterarData('fim')} />
          </label>
          {invalido && <span className="erro-campo">A data inicial deve ser anterior à final.</span>}
        </div>
      )}
    </div>
  );
}
