import { NavLink } from 'react-router-dom';
import { restaurante } from '../config/tema.js';
import { rotas } from '../rotas.js';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-nome">{restaurante.nome}</div>
        <div className="logo-subtitulo">{restaurante.subtitulo}</div>
      </div>

      <nav>
        <ul className="menu">
          {rotas.map((r) => (
            <li key={r.caminho}>
              <NavLink to={r.caminho} end={r.caminho === '/'}>
                {r.rotulo}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Apenas visual: o sistema não possui login. */}
      <button type="button" className="botao-sair" title="O sistema não possui login">
        Sair
      </button>
    </aside>
  );
}
