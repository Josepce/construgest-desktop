import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Banco PostgreSQL embarcado (WASM). Não exige PostgreSQL, Docker ou .env.
// No Electron, ELECTRON_DATA_DIR aponta para a pasta AppData do usuário.
const dataDir = process.env.ELECTRON_DATA_DIR || path.resolve(process.cwd(), 'construgest-data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new PGlite(dataDir);

export const pool = {
  async query(sql, params = []) {
    return db.query(sql, params);
  },
  async connect() {
    // Mantém compatibilidade com a API que o servidor já usa.
    return {
      query: (sql, params = []) => db.query(sql, params),
      release() {}
    };
  }
};

export async function initDb() {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const schema = fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8');
  await db.exec(schema);
}

export async function tx(fn) {
  return db.transaction(async trx => {
    const client = { query: (sql, params = []) => trx.query(sql, params), release() {} };
    return fn(client);
  });
}
