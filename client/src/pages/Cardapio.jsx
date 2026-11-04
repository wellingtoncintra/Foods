import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toPng } from 'html-to-image';
import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-700.css';
import '@fontsource/montserrat/latin-800.css';
import '@fontsource/dancing-script/latin-600.css';
import '@fontsource/dancing-script/latin-700.css';
import '@fontsource/lilita-one/latin-400.css';
import '../styles/cardapio.css';
import Calendario from '../components/cardapio/Calendario.jsx';
import SeletorPreparos from '../components/cardapio/SeletorPreparos.jsx';
import ImagemCardapio, { LARGURA, ALTURA } from '../components/cardapio/ImagemCardapio.jsx';
import Mensagem from '../components/Mensagem.jsx';
import Confirmacao from '../components/Confirmacao.jsx';
import { listarProdutos } from '../services/produtos.js';
import { listarPreparos, cadastrarPreparo } from '../services/preparos.js';
import { listarDiasComCardapio, obterCardapio, salvarCardapio, excluirCardapio } from '../services/cardapios.js';
import { hoje as hojeCuiaba, somarDias, diaDaSemana, dataCurta } from '../utils/periodo.js';
import { moeda } from '../utils/formatar.js';

// Limites iguais aos do servidor (layout A4)
const LIMITES = { MARMITA: 4, PRATO: 4, PROTEINA: 6, ACOMPANHAMENTO: 10 };

const ordenarPorPreco = (a, b) => a.tipo.localeCompare(b.tipo) || Number(a.precoVenda) - Number(b.precoVenda) || a.nome.localeCompare(b.nome);
const rascunhoVazio = { produtoIds: [], proteinas: [], acompanhamentos: [] };
const iguais = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Pré-visualização reduzida da imagem (a imagem real é renderizada em 1414 × 2000)
function Previa({ cardapio, refImagem }) {
  const moldura = useRef(null);
  const [escala, setEscala] = useState(0.4);
  useLayoutEffect(() => {
    if (!moldura.current) return undefined;
    const observar = new ResizeObserver(([e]) => setEscala(e.contentRect.width / LARGURA));
    observar.observe(moldura.current);
    return () => observar.disconnect();
  }, []);
  return (
    <div ref={moldura} className="previa-moldura" style={{ height: ALTURA * escala }}>
      <div className="previa-escala" style={{ transform: `scale(${escala})` }}>
        <ImagemCardapio ref={refImagem} cardapio={cardapio} />
      </div>
    </div>
  );
}

// Tela Cardápio (RF010, RF012): calendário, montagem do cardápio do dia e imagem de divulgação.
export default function Cardapio() {
  const hoje = hojeCuiaba();
  const [mes, setMes] = useState(() => ({ ano: Number(hoje.slice(0, 4)), mes: Number(hoje.slice(5, 7)) - 1 }));
  const [diasComCardapio, setDiasComCardapio] = useState(new Set());
  const [carregandoMes, setCarregandoMes] = useState(false);
  const [selecionada, setSelecionada] = useState(hoje);
  const [salvo, setSalvo] = useState(undefined); // undefined = carregando; null = sem cardápio
  const [produtos, setProdutos] = useState([]);
  const [preparos, setPreparos] = useState([]);
  const [listasProntas, setListasProntas] = useState(false);
  const inicializadoPara = useRef(null); // evita refazer o rascunho ao cadastrar um preparo novo
  const [rascunho, setRascunho] = useState(rascunhoVazio);
  const [base, setBase] = useState(rascunhoVazio); // estado salvo, para detectar alterações
  const [salvando, setSalvando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const refImagem = useRef(null);

  const fecharMensagem = useCallback(() => setMensagem(null), []);
  const editavel = selecionada === hoje;
  const alterado = editavel && !iguais(rascunho, base);

  // ---------- Carregamentos ----------
  const carregarMes = useCallback(async ({ ano, mes: m }) => {
    const inicio = `${ano}-${String(m + 1).padStart(2, '0')}-01`;
    const fim = new Date(Date.UTC(ano, m + 1, 0)).toISOString().slice(0, 10);
    setCarregandoMes(true);
    try {
      const dias = await listarDiasComCardapio(inicio, fim);
      setDiasComCardapio(new Set(dias.map((d) => d.data)));
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: `Não foi possível carregar o calendário: ${err.message}` });
    } finally {
      setCarregandoMes(false);
    }
  }, []);

  useEffect(() => {
    carregarMes(mes);
  }, [mes, carregarMes]);

  // Produtos (marmitas e pratos) e preparos ativos, para montar o cardápio
  useEffect(() => {
    Promise.all([listarProdutos({ ativo: true }), listarPreparos({ ativo: true })])
      .then(([prods, preps]) => {
        setProdutos(prods.filter((p) => p.tipo === 'MARMITA' || p.tipo === 'PRATO').sort(ordenarPorPreco));
        setPreparos(preps);
        setListasProntas(true);
      })
      .catch((err) => setMensagem({ tipo: 'erro', texto: `Não foi possível carregar produtos e preparos: ${err.message}` }));
  }, []);

  const preparosPorTipo = useMemo(
    () => ({ PROTEINA: preparos.filter((p) => p.tipo === 'PROTEINA'), ACOMPANHAMENTO: preparos.filter((p) => p.tipo === 'ACOMPANHAMENTO') }),
    [preparos],
  );

  // Converte um cardápio salvo em rascunho editável, descartando itens que ficaram inativos
  const rascunhoDe = useCallback(
    (c) => {
      const prodAtivos = new Set(produtos.map((p) => p.id));
      const prepAtivos = new Set(preparos.map((p) => p.id));
      const r = {
        produtoIds: [...c.marmitas, ...c.pratos].map((p) => p.produtoId).filter((id) => prodAtivos.has(id)),
        proteinas: c.proteinas.map((p) => p.preparoId).filter((id) => prepAtivos.has(id)),
        acompanhamentos: c.acompanhamentos.map((p) => p.preparoId).filter((id) => prepAtivos.has(id)),
      };
      const total = c.marmitas.length + c.pratos.length + c.proteinas.length + c.acompanhamentos.length;
      const removidos = total - (r.produtoIds.length + r.proteinas.length + r.acompanhamentos.length);
      return { r, removidos };
    },
    [produtos, preparos],
  );

  // Carrega o dia selecionado
  useEffect(() => {
    let ignorar = false;
    setSalvo(undefined);
    obterCardapio(selecionada)
      .then((c) => {
        if (ignorar) return;
        setSalvo(c);
      })
      .catch((err) => !ignorar && setMensagem({ tipo: 'erro', texto: `Não foi possível carregar o cardápio: ${err.message}` }));
    return () => {
      ignorar = true;
    };
  }, [selecionada]);

  // Monta o rascunho do dia de hoje uma única vez por cardápio carregado
  useEffect(() => {
    if (!editavel || salvo === undefined || !listasProntas) return;
    const chave = `${selecionada}|${salvo?.atualizadoEm ?? 'novo'}`;
    if (inicializadoPara.current === chave) return;
    inicializadoPara.current = chave;
    if (salvo) {
      const { r, removidos } = rascunhoDe(salvo);
      setRascunho(r);
      setBase(r);
      if (removidos > 0) setMensagem({ tipo: 'aviso', texto: `${removidos} item(ns) do cardápio salvo estão inativos e foram retirados. Salve para atualizar.` });
    } else {
      // Novo cardápio: todas as marmitas e pratos ativos vêm marcados
      const r = { ...rascunhoVazio, produtoIds: produtos.map((p) => p.id) };
      setRascunho(r);
      setBase(rascunhoVazio);
    }
  }, [editavel, salvo, listasProntas, selecionada, produtos, rascunhoDe]);

  // ---------- Dados da imagem ----------
  const dadosImagem = useMemo(() => {
    if (!editavel) {
      return salvo ? { ...salvo } : null;
    }
    const prodPorId = new Map(produtos.map((p) => [p.id, p]));
    const prepPorId = new Map(preparos.map((p) => [p.id, p]));
    const prods = rascunho.produtoIds.map((id) => prodPorId.get(id)).filter(Boolean);
    const comoItem = (p) => ({ produtoId: p.id, nome: p.nome, preco: p.precoVenda });
    return {
      data: selecionada,
      marmitas: prods.filter((p) => p.tipo === 'MARMITA').map(comoItem),
      pratos: prods.filter((p) => p.tipo === 'PRATO').map(comoItem),
      proteinas: rascunho.proteinas.map((id) => prepPorId.get(id)).filter(Boolean).map((p) => ({ preparoId: p.id, nome: p.nome })),
      acompanhamentos: rascunho.acompanhamentos.map((id) => prepPorId.get(id)).filter(Boolean).map((p) => ({ preparoId: p.id, nome: p.nome })),
    };
  }, [editavel, salvo, rascunho, produtos, preparos, selecionada]);

  const imagemVazia =
    !dadosImagem || dadosImagem.marmitas.length + dadosImagem.pratos.length + dadosImagem.proteinas.length + dadosImagem.acompanhamentos.length === 0;

  // ---------- Ações ----------
  function selecionarDia(data) {
    if (data === selecionada) return;
    if (alterado) {
      setConfirmacao({
        titulo: 'Alterações não salvas',
        texto: 'O cardápio de hoje tem alterações que ainda não foram salvas. Deseja sair mesmo assim?',
        textoConfirmar: 'Sair sem salvar',
        perigo: true,
        acao: () => setSelecionada(data),
      });
      return;
    }
    setSelecionada(data);
  }

  const alternarProduto = (id) =>
    setRascunho((r) => {
      if (r.produtoIds.includes(id)) return { ...r, produtoIds: r.produtoIds.filter((p) => p !== id) };
      // mantém a ordem da lista (tipo e preço)
      const ordem = produtos.map((p) => p.id);
      return { ...r, produtoIds: [...r.produtoIds, id].sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b)) };
    });

  async function cadastrarNovo(nome, tipo) {
    const criado = await cadastrarPreparo({ nome, tipo });
    setPreparos((ps) => [...ps, criado].sort((a, b) => a.nome.localeCompare(b.nome)));
    return criado;
  }

  async function copiarUltimo() {
    try {
      const dias = await listarDiasComCardapio(somarDias(hoje, -400), somarDias(hoje, -1));
      if (dias.length === 0) {
        setMensagem({ tipo: 'aviso', texto: 'Não há cardápio anterior salvo para copiar.' });
        return;
      }
      const ultimo = dias[dias.length - 1].data;
      const c = await obterCardapio(ultimo);
      const { r, removidos } = rascunhoDe(c);
      setRascunho(r);
      setMensagem({
        tipo: removidos ? 'aviso' : 'sucesso',
        texto: `Itens copiados do cardápio de ${dataCurta(ultimo)} (${diaDaSemana(ultimo)}).${removidos ? ` ${removidos} item(ns) inativo(s) não foram copiados.` : ''} Confira e salve.`,
      });
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: `Não foi possível copiar: ${err.message}` });
    }
  }

  async function salvar() {
    setSalvando(true);
    try {
      const c = await salvarCardapio(hoje, rascunho.produtoIds, [...rascunho.proteinas, ...rascunho.acompanhamentos]);
      setSalvo(c);
      setMensagem({ tipo: 'sucesso', texto: 'Cardápio de hoje salvo.' });
      carregarMes(mes);
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message });
    } finally {
      setSalvando(false);
    }
  }

  function pedirExclusao() {
    setConfirmacao({
      titulo: 'Excluir cardápio de hoje',
      texto: 'O cardápio salvo de hoje será excluído. Você pode montar outro em seguida.',
      textoConfirmar: 'Excluir',
      perigo: true,
      acao: async () => {
        await excluirCardapio(hoje);
        setSalvo(null);
        setMensagem({ tipo: 'sucesso', texto: 'Cardápio de hoje excluído.' });
        carregarMes(mes);
      },
    });
  }

  async function confirmar() {
    const { acao } = confirmacao;
    setConfirmacao(null);
    try {
      await acao();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message });
    }
  }

  // Gera o PNG em tamanho real a partir do componente da imagem
  async function baixarImagem() {
    if (!refImagem.current) return;
    setGerando(true);
    try {
      await document.fonts.ready;
      const url = await toPng(refImagem.current, { width: LARGURA, height: ALTURA, pixelRatio: 1, cacheBust: true });
      const link = document.createElement('a');
      const dia = diaDaSemana(selecionada)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
      link.download = `cardapio-${selecionada}-${dia}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: 'Não foi possível gerar a imagem. Tente novamente.' });
    } finally {
      setGerando(false);
    }
  }

  // ---------- Renderização ----------
  const marmitas = produtos.filter((p) => p.tipo === 'MARMITA');
  const pratos = produtos.filter((p) => p.tipo === 'PRATO');
  const contagem = (tipo) => rascunho.produtoIds.filter((id) => produtos.find((p) => p.id === id)?.tipo === tipo).length;

  const listaProdutos = (titulo, lista, tipo) => (
    <div className="editor-secao">
      <h3>
        {titulo}
        <span className="editor-contagem">
          {contagem(tipo)} de {LIMITES[tipo]}
        </span>
      </h3>
      {lista.length === 0 ? (
        <p className="texto-suave texto-pequeno">
          Nenhum produto ativo deste tipo. Cadastre em <Link to="/produtos">Produtos</Link>.
        </p>
      ) : (
        <ul className="lista-marcar">
          {lista.map((p) => {
            const marcado = rascunho.produtoIds.includes(p.id);
            return (
              <li key={p.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => alternarProduto(p.id)}
                    disabled={salvando || (!marcado && contagem(tipo) >= LIMITES[tipo])}
                  />
                  {p.nome}
                  <span className="preco-lateral">{moeda(p.precoVenda)}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  const listaLeitura = (titulo, itens, comPreco) =>
    itens.length > 0 && (
      <div className="editor-secao">
        <h3>{titulo}</h3>
        <ul className="lista-leitura">
          {itens.map((i) => (
            <li key={i.produtoId ?? i.preparoId}>
              <span>{i.nome}</span>
              {comPreco && <span className="texto-suave">{moeda(i.preco)}</span>}
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <div>
      <Mensagem mensagem={mensagem} aoFechar={fecharMensagem} />

      <div className="grade-cardapio">
        <div className="coluna-cardapio">
          <Calendario
            mes={mes}
            diasComCardapio={diasComCardapio}
            selecionada={selecionada}
            hoje={hoje}
            aoSelecionar={selecionarDia}
            aoMudarMes={setMes}
            carregando={carregandoMes}
          />

          <section className="card">
            <h2 className="titulo-card">
              {editavel ? 'Cardápio de hoje' : 'Cardápio de'} — {diaDaSemana(selecionada)}, {dataCurta(selecionada)}
            </h2>

            {salvo === undefined ? (
              <p className="texto-suave">Carregando...</p>
            ) : !editavel ? (
              <>
                <div className="somente-consulta">Cardápio de dia anterior: disponível apenas para consulta.</div>
                {salvo ? (
                  <>
                    {listaLeitura('Marmitas', salvo.marmitas, true)}
                    {listaLeitura('Pratos', salvo.pratos, true)}
                    {listaLeitura('Proteínas', salvo.proteinas)}
                    {listaLeitura('Acompanhamentos', salvo.acompanhamentos)}
                  </>
                ) : (
                  <p className="texto-suave">Não há cardápio salvo neste dia.</p>
                )}
                <button type="button" className="botao botao-secundario" style={{ marginTop: 16 }} onClick={() => selecionarDia(hoje)}>
                  Ir para o cardápio de hoje
                </button>
              </>
            ) : (
              <>
                {!salvo && <p className="texto-suave texto-pequeno">Ainda não há cardápio salvo para hoje.</p>}
                {listaProdutos('Marmitas', marmitas, 'MARMITA')}
                {listaProdutos('Pratos', pratos, 'PRATO')}
                <SeletorPreparos
                  titulo="Proteínas"
                  rotuloNovo="proteína"
                  selecionados={rascunho.proteinas}
                  disponiveis={preparosPorTipo.PROTEINA}
                  limite={LIMITES.PROTEINA}
                  aoAlterar={(ids) => setRascunho((r) => ({ ...r, proteinas: ids }))}
                  aoCadastrar={(nome) => cadastrarNovo(nome, 'PROTEINA')}
                  desabilitado={salvando}
                />
                <SeletorPreparos
                  titulo="Acompanhamentos"
                  rotuloNovo="acompanhamento"
                  selecionados={rascunho.acompanhamentos}
                  disponiveis={preparosPorTipo.ACOMPANHAMENTO}
                  limite={LIMITES.ACOMPANHAMENTO}
                  aoAlterar={(ids) => setRascunho((r) => ({ ...r, acompanhamentos: ids }))}
                  aoCadastrar={(nome) => cadastrarNovo(nome, 'ACOMPANHAMENTO')}
                  desabilitado={salvando}
                />

                {alterado && <p className="aviso-alteracoes">Há alterações não salvas.</p>}

                <div className="editor-acoes">
                  <div>
                    <button type="button" className="botao botao-secundario" onClick={copiarUltimo} disabled={salvando}>
                      Copiar do último cardápio
                    </button>
                    {salvo && (
                      <button type="button" className="botao botao-perigo" onClick={pedirExclusao} disabled={salvando}>
                        Excluir
                      </button>
                    )}
                  </div>
                  <button type="button" className="botao botao-primario" onClick={salvar} disabled={salvando || (!alterado && !!salvo) || imagemVazia}>
                    {salvando ? 'Salvando...' : salvo ? 'Salvar alterações' : 'Salvar cardápio'}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>

        <section className="card">
          <div className="previa-cabecalho">
            <h2 className="titulo-card" style={{ margin: 0 }}>
              Imagem de divulgação
            </h2>
            <button type="button" className="botao botao-primario" onClick={baixarImagem} disabled={imagemVazia || gerando || salvo === undefined}>
              {gerando ? 'Gerando...' : 'Baixar imagem (PNG)'}
            </button>
          </div>
          {editavel && alterado && <p className="aviso-alteracoes" style={{ marginTop: -6, marginBottom: 12 }}>A imagem mostra o rascunho; lembre de salvar o cardápio.</p>}
          {salvo === undefined ? (
            <div className="previa-vazia">Carregando...</div>
          ) : imagemVazia ? (
            <div className="previa-vazia">{editavel ? 'Escolha os itens do cardápio para ver a imagem.' : 'Não há cardápio salvo neste dia.'}</div>
          ) : (
            <Previa cardapio={dadosImagem} refImagem={refImagem} />
          )}
        </section>
      </div>

      <Confirmacao dados={confirmacao} aoCancelar={() => setConfirmacao(null)} aoConfirmar={confirmar} />
    </div>
  );
}
