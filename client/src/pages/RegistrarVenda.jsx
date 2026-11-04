import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CardProduto from '../components/CardProduto.jsx';
import ResumoVenda from '../components/ResumoVenda.jsx';
import VendasRecentes from '../components/VendasRecentes.jsx';
import Mensagem from '../components/Mensagem.jsx';
import { listarProdutos } from '../services/produtos.js';
import { listarVendas, registrarVenda } from '../services/vendas.js';
import { TIPOS_PRODUTO, paraCentavos, moeda } from '../utils/formatar.js';

const QTD_RECENTES = 8;

// Tela Registrar Venda (RF004, RF005 — UC002)
export default function RegistrarVenda() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroProdutos, setErroProdutos] = useState(null);
  const [quantidades, setQuantidades] = useState({}); // { [produtoId]: quantidade }
  const [tipo, setTipo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [recentes, setRecentes] = useState({ vendas: [], carregando: true, erro: null });

  const fecharMensagem = useCallback(() => setMensagem(null), []);

  // Só produtos ativos aparecem aqui (regra 5). Remove da venda os que deixaram de estar ativos.
  const carregarProdutos = useCallback(async () => {
    try {
      const ativos = await listarProdutos({ ativo: true });
      setProdutos(ativos);
      setErroProdutos(null);
      const ids = new Set(ativos.map((p) => p.id));
      setQuantidades((q) => Object.fromEntries(Object.entries(q).filter(([id]) => ids.has(Number(id)))));
    } catch (err) {
      setErroProdutos(`Não foi possível carregar os produtos: ${err.message}`);
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarRecentes = useCallback(async () => {
    try {
      const { vendas } = await listarVendas({ limite: QTD_RECENTES });
      setRecentes({ vendas, carregando: false, erro: null });
    } catch (err) {
      setRecentes((r) => ({ ...r, carregando: false, erro: `Não foi possível carregar as vendas: ${err.message}` }));
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
    carregarRecentes();
  }, [carregarProdutos, carregarRecentes]);

  const alterarQuantidade = (id, quantidade) =>
    setQuantidades((q) => {
      const novo = { ...q };
      if (quantidade > 0) novo[id] = quantidade;
      else delete novo[id];
      return novo;
    });

  // Itens na ordem em que aparecem na grade, com subtotal em centavos (só para exibição)
  const itens = useMemo(
    () =>
      produtos
        .filter((p) => quantidades[p.id] > 0)
        .map((p) => ({ produto: p, quantidade: quantidades[p.id], subtotalCentavos: paraCentavos(p.precoVenda) * quantidades[p.id] })),
    [produtos, quantidades],
  );
  const totalCentavos = itens.reduce((s, i) => s + i.subtotalCentavos, 0);

  const visiveis = tipo ? produtos.filter((p) => p.tipo === tipo) : produtos;
  const tiposExistentes = TIPOS_PRODUTO.filter((t) => produtos.some((p) => p.tipo === t.valor));

  async function concluir() {
    if (itens.length === 0) {
      setMensagem({ tipo: 'erro', texto: 'Selecione pelo menos um produto para registrar a venda.' });
      return;
    }
    setEnviando(true);
    try {
      const venda = await registrarVenda(itens.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })));
      setMensagem({ tipo: 'sucesso', texto: `Venda nº ${venda.id} registrada — ${moeda(venda.valorTotal)}.` });
      setQuantidades({});
      carregarRecentes();
    } catch (err) {
      // Venda não registrada: mantém a seleção para o funcionário tentar de novo
      setMensagem({ tipo: 'erro', texto: err.message });
      if (err.status === 400 || err.status === 409) carregarProdutos();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <Mensagem mensagem={mensagem} aoFechar={fecharMensagem} />

      <div className="grade-venda">
        <section>
          {tiposExistentes.length > 1 && (
            <div className="chips" role="group" aria-label="Filtrar por tipo">
              <button type="button" className={`chip ${tipo === '' ? 'chip-ativo' : ''}`} onClick={() => setTipo('')}>
                Todos
              </button>
              {tiposExistentes.map((t) => (
                <button key={t.valor} type="button" className={`chip ${tipo === t.valor ? 'chip-ativo' : ''}`} onClick={() => setTipo(t.valor)}>
                  {t.rotulo}
                </button>
              ))}
            </div>
          )}

          {carregando ? (
            <p className="texto-suave">Carregando produtos...</p>
          ) : erroProdutos ? (
            <div className="card">
              <p className="erro-campo">{erroProdutos}</p>
            </div>
          ) : produtos.length === 0 ? (
            <div className="card">
              <p>Não há produtos disponíveis para registrar a venda.</p>
              <p className="texto-suave" style={{ marginTop: 8 }}>
                Cadastre ou ative produtos na tela <Link to="/produtos">Produtos</Link>.
              </p>
            </div>
          ) : (
            <div className="grade-cards-produto">
              {visiveis.map((p) => (
                <CardProduto
                  key={p.id}
                  produto={p}
                  quantidade={quantidades[p.id] ?? 0}
                  aoAlterar={(q) => alterarQuantidade(p.id, q)}
                  desabilitado={enviando}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="coluna-lateral">
          <ResumoVenda
            itens={itens}
            totalCentavos={totalCentavos}
            aoRemover={(id) => alterarQuantidade(id, 0)}
            aoLimpar={() => setQuantidades({})}
            aoConcluir={concluir}
            enviando={enviando}
          />
          <VendasRecentes vendas={recentes.vendas} carregando={recentes.carregando} erro={recentes.erro} />
        </aside>
      </div>
    </div>
  );
}
