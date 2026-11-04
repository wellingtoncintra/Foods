import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pasta onde ficam as fotos dos produtos (servida em /uploads).
export const PASTA_UPLOADS = path.resolve(__dirname, '..', '..', 'uploads');
export const PREFIXO_URL_UPLOADS = '/uploads';
