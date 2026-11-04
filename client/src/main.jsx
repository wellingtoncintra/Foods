import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { rotas } from './rotas.js';
import { aplicarTema } from './config/tema.js';
import './styles/global.css';

aplicarTema();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {rotas.map(({ caminho, Componente }) => (
            <Route key={caminho} path={caminho} element={<Componente />} />
          ))}
          <Route path="*" element={<p>Página não encontrada.</p>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
