import { Fragment, useCallback, useEffect, useState } from 'react';
import SeletorPeriodo, { periodoInicial } from '../components/SeletorPeriodo.jsx';
import DetalheVenda from '../components/DetalheVenda.jsx';
import Confirmacao from '../components/Confirmacao.jsx';
import Mensagem from '../components/Mensagem.jsx';
import { listarVendas, cancelarVenda } from '../services/vendas.js';
import { moeda } from '../utils/formatar.js';
import { dataHora } from '../utils/periodo.js';

const POR_PAGINA = 20;

const resumoItens = (itens) => itens.map((i) => `${i.quantidade}× ${i.produtoNome}`).join(', ');

// Tela Histórico de Vendas (RF006) com cancelamento
export default function Historico() {
  const [periodo, setPeriodo] = useState(() => periodoInicial('hoje'));
  const [status, setStatus] = useState('');
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState({ vendas: [], total: 0, totalPaginas: 1 });
  const [carregando, setCarregando] = useState(true);
  const [recarga, setRecarga] = useState(0);
  const [aberta, setAberta] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [aCancelar, setACancelar] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [processando, setProcessando] = useState(false);

  const fecharMensagem = useCallback(() => setMensagem(null), []);
  const periodoInvalido = periodo.inicio && periodo.fim && periodo.inicio > periodo.fim;

  useEffect(() => {
    if (periodoInvalido) return undefined;
    let ignorar = false;
    setCarregando(true);
    listarVendas({ inicio: periodo.inicio, fim: periodo.fim, status, pagina, limite: POR_PAGINA })
      .then((dados) => !ignorar && setResultado(dados))
      .catch((err) => !ignorar && setMensagem({ tipo: 'erro', texto: `Não foi possível carregar as vendas: ${err.message}` }))
      .finally(() => !ignorar && setCarregando(false));
    return () => {
      ignorar = true;
    };
  }, [periodo, status, pagina, recarga, periodoInvalido]);

  function alterarPeriodo(novo) {
    setPeriodo(novo);
    setPagina(1);
    setAberta(null);
  }

  function alterarStatus(e) {
    setStatus(e.target.value);
    setPagina(1);
    setAberta(null);
  }

  function pedirCancelamento(venda) {
    setMotivo('');
    setACancelar(venda);
  }

  async function confirmarCancelamento() {
    setProcessando(true);
    try {
      await cancelarVenda(aCancelar.id, motivo.trim());
      setMensagem({ tipo: 'sucesso', texto: `Venda nº ${aCancelar.id} cancelada.` });
      setRecarga((r) => r + 1);
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message });
    } finally {
      setProcessando(false);
      setACancelar(null);
    }
  }

  const { vendas, total, totalPaginas } = resultado;

  return (
    <div>
      <Mensagem mensagem={mensagem} aoFechar={fecharMensagem} />

      <section className="card">
        <div className="filtros-historico">
          <SeletorPeriodo valor={periodo} aoAlterar={alterarPeriodo} />
          <select value={status} onChange={alterarStatus} aria-label="Filtrar por status" className="filtro-status">
            <option value="">Todas as vendas</option>
            <option value="CONCLUIDA">Concluídas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </div>

        {carregando && vendas.length === 0 ? (
          <p className="texto-suave">Carregando vendas...</p>
        ) : vendas.length === 0 ? (
          <p className="texto-suave">Nenhuma venda encontrada neste período.</p>
        ) : (
          <div className={`tabela-rolagem ${carregando ? 'carregando' : ''}`}>
            <table className="tabela tabela-historico">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Data e hora</th>
                  <th>Itens</th>
                  <th className="numero">Total</th>
                  <th>Status</th>
                  <th aria-label="Expandir" />
                </tr>
              </thead>
              <tbody>
                {vendas.map((v) => {
                  const expandida = aberta === v.id;
                  return (
                    <Fragment key={v.id}>
                      <tr
                        className={`linha-clicavel ${v.status === 'CANCELADA' ? 'linha-cancelada' : ''} ${expandida ? 'linha-expandida' : ''}`}
                        onClick={() => setAberta(expandida ? null : v.id)}
                        aria-expanded={expandida}
                      >
                        <td>{v.id}</td>
                        <td className="sem-quebra">{dataHora(v.dataHora)}</td>
                        <td className="celula-itens">{resumoItens(v.itens)}</td>
                        <td className="numero valor-venda">{moeda(v.valorTotal)}</td>
                        <td>
                          <span className={`etiqueta ${v.status === 'CANCELADA' ? 'etiqueta-cancelada' : 'etiqueta-ativo'}`}>
                            {v.status === 'CANCELADA' ? 'Cancelada' : 'Concluída'}
                          </span>
                        </td>
                        <td className="seta">{expandida ? '▲' : '▼'}</td>
                      </tr>
                      {expandida && (
                        <tr className="linha-detalhe">
                          <td colSpan={6}>
                            <DetalheVenda venda={v} aoCancelar={pedirCancelamento} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && (
          <div className="paginacao">
            <span className="texto-suave">
              {total} {total === 1 ? 'venda encontrada' : 'vendas encontradas'}
            </span>
            {totalPaginas > 1 && (
              <div className="paginacao-botoes">
                <button type="button" className="botao botao-secundario botao-pequeno" onClick={() => setPagina((p) => p - 1)} disabled={pagina <= 1 || carregando}>
                  ← Anterior
                </button>
                <span>
                  Página {pagina} de {totalPaginas}
                </span>
                <button
                  type="button"
                  className="botao botao-secundario botao-pequeno"
                  onClick={() => setPagina((p) => p + 1)}
                  disabled={pagina >= totalPaginas || carregando}
                >
                  Próxima →
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <Confirmacao
        dados={
          aCancelar && {
            titulo: `Cancelar venda nº ${aCancelar.id}`,
            texto: `A venda de ${moeda(aCancelar.valorTotal)} deixará de contar no faturamento e nos indicadores. O cancelamento é definitivo.`,
            textoConfirmar: 'Cancelar venda',
            perigo: true,
          }
        }
        textoCancelar="Voltar"
        processando={processando}
        aoCancelar={() => setACancelar(null)}
        aoConfirmar={confirmarCancelamento}
      >
        <div className="campo" style={{ marginTop: 14 }}>
          <label htmlFor="motivo">Motivo (opcional)</label>
          <input id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={255} placeholder="Ex.: lançamento duplicado" />
        </div>
      </Confirmacao>
    </div>
  );
}
