import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { cores, coresGrafico } from '../config/tema.js';
import { moeda, moedaDeCentavos, paraCentavos } from '../utils/formatar.js';

const SERIES = [
  { chave: 'faturamento', rotulo: 'Faturamento', cor: coresGrafico.faturamento },
  { chave: 'lucro', rotulo: 'Lucro', cor: coresGrafico.lucro },
];

// "2026-11-03" → "03/11" (dia) ou "nov/26" (mês). Datas da série já estão no fuso de Cuiabá.
function rotuloPeriodo(chave, agrupamento, longo = false) {
  const [a, m, d] = chave.split('-').map(Number);
  const data = new Date(Date.UTC(a, m - 1, d));
  if (agrupamento === 'mes') {
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC', month: longo ? 'long' : 'short', year: longo ? 'numeric' : '2-digit' });
  }
  return longo
    ? data.toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
    : `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

// Eixo Y compacto: 1500 → "R$ 1,5 mil"
const eixoMoeda = (v) => (Math.abs(v) >= 1000 ? `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : `R$ ${v}`);

function Dica({ active, payload, agrupamento }) {
  if (!active || !payload?.length) return null;
  const ponto = payload[0].payload;
  return (
    <div className="dica-grafico">
      <div className="dica-titulo">{rotuloPeriodo(ponto.periodo, agrupamento, true)}</div>
      {SERIES.map((s) => (
        <div key={s.chave} className="dica-linha">
          <span className="amostra-cor" style={{ background: s.cor }} />
          <span>{s.rotulo}</span>
          <strong>{moedaDeCentavos(ponto[`${s.chave}Centavos`])}</strong>
        </div>
      ))}
      <div className="dica-linha dica-secundaria">
        <span />
        <span>Vendas</span>
        <strong>{ponto.vendas}</strong>
      </div>
    </div>
  );
}

// Evolução do faturamento e do lucro (mesma unidade, um só eixo).
export default function GraficoEvolucao({ serie, agrupamento }) {
  const [comoTabela, setComoTabela] = useState(false);

  const dados = serie.map((p) => {
    const fat = paraCentavos(p.faturamento);
    const luc = paraCentavos(p.lucro);
    // Valores em reais (number) só para posicionar os pontos; os textos usam centavos exatos
    return { ...p, faturamento: fat / 100, lucro: luc / 100, faturamentoCentavos: fat, lucroCentavos: luc };
  });

  return (
    <section className="card">
      <div className="cabecalho-card">
        <h2 className="titulo-card">Faturamento e lucro por {agrupamento === 'mes' ? 'mês' : 'dia'}</h2>
        <button type="button" className="botao botao-link link-discreto" onClick={() => setComoTabela((t) => !t)}>
          {comoTabela ? 'Ver gráfico' : 'Ver como tabela'}
        </button>
      </div>

      {serie.length < 2 ? (
        <p className="texto-suave">Selecione um período com mais de um dia para ver a evolução.</p>
      ) : comoTabela ? (
        <div className="tabela-rolagem tabela-serie">
          <table className="tabela">
            <thead>
              <tr>
                <th>{agrupamento === 'mes' ? 'Mês' : 'Dia'}</th>
                <th className="numero">Vendas</th>
                <th className="numero">Faturamento</th>
                <th className="numero">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {serie.map((p) => (
                <tr key={p.periodo}>
                  <td>{rotuloPeriodo(p.periodo, agrupamento, true)}</td>
                  <td className="numero">{p.vendas}</td>
                  <td className="numero">{moeda(p.faturamento)}</td>
                  <td className="numero">{moeda(p.lucro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="legenda-grafico" aria-hidden="true">
            {SERIES.map((s) => (
              <span key={s.chave} className="legenda-item">
                <span className="amostra-linha" style={{ background: s.cor }} />
                {s.rotulo}
              </span>
            ))}
          </div>
          <div className="area-grafico" role="img" aria-label={`Gráfico de faturamento e lucro por ${agrupamento === 'mes' ? 'mês' : 'dia'}. Use "Ver como tabela" para os valores.`}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dados} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid vertical={false} stroke={coresGrafico.grade} />
                <XAxis
                  dataKey="periodo"
                  tickFormatter={(c) => rotuloPeriodo(c, agrupamento)}
                  tick={{ fill: coresGrafico.eixo, fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: coresGrafico.grade }}
                  minTickGap={18}
                />
                <YAxis tickFormatter={eixoMoeda} tick={{ fill: coresGrafico.eixo, fontSize: 12 }} tickLine={false} axisLine={false} width={78} />
                <Tooltip content={<Dica agrupamento={agrupamento} />} cursor={{ stroke: coresGrafico.eixo, strokeDasharray: '3 3' }} />
                {SERIES.map((s) => (
                  <Line
                    key={s.chave}
                    type="monotone"
                    dataKey={s.chave}
                    name={s.rotulo}
                    stroke={s.cor}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, stroke: cores.superficie, strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
