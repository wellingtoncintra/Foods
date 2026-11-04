import { useCallback, useEffect, useState } from 'react';
import FormProduto from '../components/FormProduto.jsx';
import ListaProdutos from '../components/ListaProdutos.jsx';
import Mensagem from '../components/Mensagem.jsx';
import Confirmacao from '../components/Confirmacao.jsx';
import {
  listarProdutos,
  cadastrarProduto,
  alterarProduto,
  alterarSituacaoProduto,
  excluirProduto,
  enviarFotoProduto,
  removerFotoProduto,
} from '../services/produtos.js';

// Tela Manter Produto (RF001, RF002, RF003)
export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [emEdicao, setEmEdicao] = useState(null);
  const [chaveForm, setChaveForm] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [errosServidor, setErrosServidor] = useState({});
  const [mensagem, setMensagem] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const [processando, setProcessando] = useState(false);

  const fecharMensagem = useCallback(() => setMensagem(null), []);
  const fecharConfirmacao = useCallback(() => setConfirmacao(null), []);

  const carregar = useCallback(async () => {
    try {
      setProdutos(await listarProdutos());
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: `Não foi possível carregar os produtos: ${err.message}` });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function limparFormulario() {
    setEmEdicao(null);
    setErrosServidor({});
    setChaveForm((k) => k + 1);
  }

  function editar(produto) {
    setEmEdicao(produto);
    setErrosServidor({});
    setChaveForm((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function salvar(dados, foto) {
    setSalvando(true);
    setErrosServidor({});
    let salvo;
    try {
      salvo = emEdicao ? await alterarProduto(emEdicao.id, dados) : await cadastrarProduto(dados);
    } catch (err) {
      if (err.detalhes?.length) {
        setErrosServidor(Object.fromEntries(err.detalhes.map((d) => [d.campo, d.mensagem])));
      }
      setMensagem({ tipo: 'erro', texto: err.message });
      setSalvando(false);
      return;
    }

    // O produto já foi salvo; a foto é enviada em seguida.
    let avisoFoto = null;
    try {
      if (foto.arquivo) await enviarFotoProduto(salvo.id, foto.arquivo);
      else if (foto.remover && salvo.imagemUrl) await removerFotoProduto(salvo.id);
    } catch (err) {
      avisoFoto = `Produto salvo, mas a foto não foi atualizada: ${err.message}`;
    }

    setMensagem(
      avisoFoto
        ? { tipo: 'aviso', texto: avisoFoto }
        : { tipo: 'sucesso', texto: emEdicao ? `Produto "${salvo.nome}" alterado.` : `Produto "${salvo.nome}" cadastrado.` },
    );
    setSalvando(false);
    limparFormulario();
    carregar();
  }

  function pedirAlternarSituacao(produto) {
    if (!produto.ativo) {
      executar(() => alterarSituacaoProduto(produto.id, true), `Produto "${produto.nome}" ativado.`);
      return;
    }
    setConfirmacao({
      titulo: 'Desativar produto',
      texto: `"${produto.nome}" deixará de aparecer em Registrar Venda e no cardápio. O histórico de vendas é mantido. Você pode reativá-lo depois.`,
      textoConfirmar: 'Desativar',
      acao: () => alterarSituacaoProduto(produto.id, false),
      sucesso: `Produto "${produto.nome}" desativado.`,
    });
  }

  function pedirExclusao(produto) {
    setConfirmacao({
      titulo: 'Excluir produto',
      texto: `Tem certeza que deseja excluir "${produto.nome}"? Esta ação não pode ser desfeita.`,
      textoConfirmar: 'Excluir',
      perigo: true,
      acao: () => excluirProduto(produto.id),
      sucesso: `Produto "${produto.nome}" excluído.`,
      aposSucesso: () => emEdicao?.id === produto.id && limparFormulario(),
    });
  }

  async function executar(acao, textoSucesso, aposSucesso) {
    setProcessando(true);
    try {
      await acao();
      setMensagem({ tipo: 'sucesso', texto: textoSucesso });
      aposSucesso?.();
      await carregar();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message });
    } finally {
      setProcessando(false);
      setConfirmacao(null);
    }
  }

  return (
    <div className="pagina-produtos">
      <Mensagem mensagem={mensagem} aoFechar={fecharMensagem} />

      <div className="grade-produtos">
        <FormProduto
          key={chaveForm}
          produto={emEdicao}
          aoSalvar={salvar}
          aoCancelar={limparFormulario}
          salvando={salvando}
          errosServidor={errosServidor}
        />
        <ListaProdutos
          produtos={produtos}
          carregando={carregando}
          idEmEdicao={emEdicao?.id}
          aoEditar={editar}
          aoAlternarSituacao={pedirAlternarSituacao}
          aoExcluir={pedirExclusao}
        />
      </div>

      <Confirmacao
        dados={confirmacao}
        processando={processando}
        aoCancelar={fecharConfirmacao}
        aoConfirmar={() => executar(confirmacao.acao, confirmacao.sucesso, confirmacao.aposSucesso)}
      />
    </div>
  );
}
