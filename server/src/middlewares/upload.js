import multer from 'multer';
import { AppError } from '../lib/AppError.js';
import { PASTA_UPLOADS } from '../lib/caminhos.js';

export const TAMANHO_MAXIMO_FOTO = 2 * 1024 * 1024; // 2 MB

const EXTENSOES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const armazenamento = multer.diskStorage({
  destination: PASTA_UPLOADS,
  filename: (req, arquivo, cb) => {
    // Nome novo a cada envio: evita cache do navegador ao trocar a foto.
    const sufixo = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `produto-${req.params.id}-${sufixo}${EXTENSOES[arquivo.mimetype]}`);
  },
});

// Recebe uma foto no campo "imagem" (JPG, PNG ou WebP, até 2 MB).
export const uploadFotoProduto = multer({
  storage: armazenamento,
  limits: { fileSize: TAMANHO_MAXIMO_FOTO, files: 1 },
  fileFilter: (req, arquivo, cb) => {
    if (EXTENSOES[arquivo.mimetype]) return cb(null, true);
    cb(new AppError('Formato de imagem inválido. Envie um arquivo JPG, PNG ou WebP.', 400));
  },
}).single('imagem');
