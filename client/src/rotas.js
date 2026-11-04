import { lazy } from 'react';
import Home from './pages/Home.jsx';
import RegistrarVenda from './pages/RegistrarVenda.jsx';
import Produtos from './pages/Produtos.jsx';
import Historico from './pages/Historico.jsx';
import Preparos from './pages/Preparos.jsx';

// O Dashboard (com Recharts) é carregado só quando a tela é aberta.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
// O Cardápio (fontes e html-to-image) também é carregado sob demanda.
const Cardapio = lazy(() => import('./pages/Cardapio.jsx'));

// Ordem do menu da sidebar e título exibido no cabeçalho de cada tela.
export const rotas = [
  { caminho: '/', rotulo: 'Home', titulo: 'Home', Componente: Home },
  { caminho: '/registrar-venda', rotulo: 'Registrar Venda', titulo: 'Registrar Venda', Componente: RegistrarVenda },
  { caminho: '/cardapio', rotulo: 'Cardápio', titulo: 'Gerar Cardápio', Componente: Cardapio },
  { caminho: '/produtos', rotulo: 'Produtos', titulo: 'Produtos', Componente: Produtos },
  { caminho: '/preparos', rotulo: 'Preparos', titulo: 'Preparos (proteínas e acompanhamentos)', Componente: Preparos },
  { caminho: '/dashboard', rotulo: 'Dashboard', titulo: 'Dashboard', Componente: Dashboard },
  { caminho: '/historico', rotulo: 'Histórico', titulo: 'Histórico de Vendas', Componente: Historico },
];
