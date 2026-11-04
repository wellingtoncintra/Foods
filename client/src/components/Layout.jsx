import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { rotas } from '../rotas.js';

export default function Layout() {
  const { pathname } = useLocation();
  const titulo = rotas.find((r) => r.caminho === pathname)?.titulo ?? 'Página não encontrada';

  return (
    <div className="layout">
      <Sidebar />
      <div className="conteudo">
        <header className="cabecalho">
          <h1>{titulo}</h1>
        </header>
        <main className="pagina">
          <Suspense fallback={<p className="texto-suave">Carregando...</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
