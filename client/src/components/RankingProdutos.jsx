import { moeda, rotuloTipo } from '../utils/formatar.js';

// Ranking de produtos mais vendidos por quantidade (RF008).
// A barra mostra a participação de cada produto no faturamento do período.
export default function RankingProdutos({ ranking }) {
  return (
    <section className="card">
      <h2 className="titulo-card">Ranking de produtos</h2>
      {ranking.length === 0 ? (
        <p className="texto-suave">Nenhum produto vendido neste período.</p>
      ) : (
        <div className="tabela-rolagem">
          <table className="tabela tabela-ranking">
            <thead>
              <tr>
                <th className="numero">#</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th className="numero">Qtd.</th>
                <th className="numero">Faturamento</th>
                <th className="numero">Lucro</th>
                <th>Participação no faturamento</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((p, i) => (
                <tr key={p.produtoId}>
                  <td className="numero posicao">{i + 1}º</td>
                  <td>
                    <span className="nome-produto">{p.nome}</span>
                    {!p.ativo && <span className="etiqueta etiqueta-inativo etiqueta-margem">Inativo</span>}
                  </td>
                  <td>{rotuloTipo(p.tipo)}</td>
                  <td className="numero">
                    <strong>{p.quantidade}</strong>
                  </td>
                  <td className="numero">{moeda(p.faturamento)}</td>
                  <td className={`numero ${p.lucro.startsWith('-') ? 'valor-negativo' : ''}`}>{moeda(p.lucro)}</td>
                  <td>
                    <div className="barra-participacao" title={`${p.participacao}% do faturamento`}>
                      <div className="barra-trilho">
                        <div className="barra-preenchida" style={{ width: `${p.participacao ?? 0}%` }} />
                      </div>
                      <span className="barra-rotulo">{(p.participacao ?? '0').replace('.', ',')}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
