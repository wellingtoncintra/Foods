import { useCallback, useEffect, useState } from 'react';
import SeletorPeriodo, { periodoInicial } from '../components/SeletorPeriodo.jsx';
import CardIndicador from '../components/CardIndicador.jsx';
import GraficoEvolucao from '../components/GraficoEvolucao.jsx';
import RankingProdutos from '../components/RankingProdutos.jsx';
import Mensagem from '../components/Mensagem.jsx';
import { obterDashboard } from '../services/dashboard.js';
import { moeda, rotuloTipo } from '../utils/formatar.js';

const pct = (v) => (v === null ? '—' : `${v.replace('.', ',')}%`);

// Dashboard (RF007, RF008, RF009). Somente vendas concluídas entram nos números.
export default function Dashboard() {
  const [periodo, setPeriodo] = useState(() => periodoInicial('mes'));
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const fecharMensagem = useCallback(() => setMensagem(null), []);

  const periodoInvalido = periodo.inicio && periodo.fim && periodo.inicio > periodo.fim;

  useEffect(() => {
    if (periodoInvalido) return undefined;
    let ignorar = false;
    setCarregando(true);
    obterDashboard(periodo)
      .then((d) => !ignorar && (setDados(d), setMensagem(null)))
      .catch((err) => !ignorar && setMensagem({ tipo: 'erro', texto: `Não foi possível carregar o dashboard: ${err.message}` }))
      .finally(() => !ignorar && setCarregando(false));
    return () => {
      ignorar = true;
    };
  }, [periodo, periodoInvalido]);

  const vazio = dados && dados.numeroVendas === 0;
  const top = dados?.produtoMaisVendido;

  return (
    <div className={`dashboard ${carregando && dados ? 'carregando' : ''}`}>
      <Mensagem mensagem={mensagem} aoFechar={fecharMensagem} />

      <section className="card barra-periodo">
        <SeletorPeriodo valor={periodo} aoAlterar={setPeriodo} />
      </section>

      {!dados ? (
        <p className="texto-suave">{carregando ? 'Carregando indicadores...' : ''}</p>
      ) : (
        <>
          {vazio && (
            <div className="mensagem mensagem-aviso">
              <span>Nenhuma venda concluída neste período.</span>
            </div>
          )}

          <div className="grade-indicadores">
            <CardIndicador rotulo="Marmitas vendidas" valor={dados.marmitasVendidas} detalhe="unidades" />
            <CardIndicador rotulo="Faturamento bruto" valor={moeda(dados.faturamentoBruto)} detalhe="soma das vendas concluídas" destaque />
            <CardIndicador rotulo="Lucro" valor={moeda(dados.lucro)} detalhe={`margem de ${pct(dados.margemLucro)}`} />
            <CardIndicador rotulo="Número de vendas" valor={dados.numeroVendas} detalhe="vendas concluídas" />
          </div>

          <div className="indicadores-secundarios card">
            <div>
              <span className="texto-suave">Ticket médio</span> <strong>{moeda(dados.ticketMedio)}</strong>
            </div>
            <div>
              <span className="texto-suave">Custo total</span> <strong>{moeda(dados.custoTotal)}</strong>
            </div>
            <div>
              <span className="texto-suave">Vendas canceladas</span>{' '}
              <strong>
                {dados.canceladas.quantidade} ({moeda(dados.canceladas.valor)})
              </strong>
              <span className="texto-suave texto-pequeno"> — fora dos cálculos</span>
            </div>
          </div>

          <GraficoEvolucao serie={dados.serie} agrupamento={dados.agrupamento} />

          <div className="grade-ranking">
            <section className="card mais-vendido">
              <h2 className="titulo-card">Produto mais vendido</h2>
              {top ? (
                <div className="mais-vendido-corpo">
                  {top.imagemUrl ? (
                    <img src={top.imagemUrl} alt="" className="mais-vendido-foto" />
                  ) : (
                    <div className="mais-vendido-foto card-produto-sem-foto">{top.nome.charAt(0).toUpperCase()}</div>
                  )}
                  <div className="mais-vendido-nome">{top.nome}</div>
                  <div className="texto-suave">{rotuloTipo(top.tipo)}</div>
                  <div className="mais-vendido-numeros">
                    <div>
                      <strong>{top.quantidade}</strong>
                      <span className="texto-suave texto-pequeno">unidades</span>
                    </div>
                    <div>
                      <strong>{moeda(top.faturamento)}</strong>
                      <span className="texto-suave texto-pequeno">{pct(top.participacao)} do faturamento</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="texto-suave">Nenhum produto vendido neste período.</p>
              )}
            </section>
            <RankingProdutos ranking={dados.ranking} />
          </div>
        </>
      )}
    </div>
  );
}
