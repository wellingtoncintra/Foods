import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CardIndicador from '../components/CardIndicador.jsx';
import VendasRecentes from '../components/VendasRecentes.jsx';
import Mensagem from '../components/Mensagem.jsx';
import { obterDashboard } from '../services/dashboard.js';
import { listarVendas } from '../services/vendas.js';
import { intervaloDoPeriodo } from '../utils/periodo.js';
import { moeda } from '../utils/formatar.js';

const nomeDoMes = () => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Cuiaba', month: 'long' }).format(new Date());

// Tela inicial: indicadores do dia e do mês, atalho para o cardápio e vendas recentes.
export default function Home() {
  const [hoje, setHoje] = useState(null);
  const [mes, setMes] = useState(null);
  const [recentes, setRecentes] = useState({ vendas: [], carregando: true, erro: null });
  const [erro, setErro] = useState(null);

  useEffect(() => {
    Promise.all([obterDashboard(intervaloDoPeriodo('hoje')), obterDashboard(intervaloDoPeriodo('mes'))])
      .then(([h, m]) => {
        setHoje(h);
        setMes(m);
      })
      .catch((err) => setErro({ tipo: 'erro', texto: `Não foi possível carregar os indicadores: ${err.message}` }));

    listarVendas({ limite: 10 })
      .then(({ vendas }) => setRecentes({ vendas, carregando: false, erro: null }))
      .catch((err) => setRecentes({ vendas: [], carregando: false, erro: `Não foi possível carregar as vendas: ${err.message}` }));
  }, []);

  const carregando = !hoje && !erro;

  return (
    <div className="home">
      <Mensagem mensagem={erro} aoFechar={() => setErro(null)} />

      <div className="home-topo">
        <p className="texto-suave">Resumo do dia e do mês. Valores de vendas concluídas.</p>
        <Link to="/cardapio" className="botao botao-primario botao-grande">
          Gerar cardápio de hoje
        </Link>
      </div>

      <div className="grade-indicadores">
        <CardIndicador rotulo="Vendas hoje" valor={hoje && moeda(hoje.faturamentoBruto)} detalhe="faturamento do dia" destaque carregando={carregando} />
        <CardIndicador rotulo="Marmitas vendidas hoje" valor={hoje?.marmitasVendidas} detalhe="unidades" carregando={carregando} />
        <CardIndicador
          rotulo="Faturamento mensal"
          valor={mes && moeda(mes.faturamentoBruto)}
          detalhe={`em ${nomeDoMes()}`}
          carregando={carregando}
        />
        <CardIndicador rotulo="Número de vendas hoje" valor={hoje?.numeroVendas} detalhe="vendas concluídas" carregando={carregando} />
      </div>

      <VendasRecentes vendas={recentes.vendas} carregando={recentes.carregando} erro={recentes.erro} />
    </div>
  );
}
