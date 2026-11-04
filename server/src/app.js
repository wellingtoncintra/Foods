import express from 'express';
import cors from 'cors';
import { rotas } from './routes/index.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/erros.js';
import { PASTA_UPLOADS, PREFIXO_URL_UPLOADS } from './lib/caminhos.js';

export const app = express();

app.use(cors());
app.use(express.json());

// Fotos dos produtos
app.use(PREFIXO_URL_UPLOADS, express.static(PASTA_UPLOADS));

app.use('/api', rotas);
app.use('/api', rotaNaoEncontrada);

app.use(tratarErros);
