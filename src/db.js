import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Banco PostgreSQL embarcado (WASM). Não exige PostgreSQL, Docker ou .env.
// No Electron, ELECTRON_DATA_DIR aponta para a pasta AppData do usuário.
const dataDir = process.env.ELECTRON_DATA_DIR || path.resolve(process.cwd(), 'construgest-data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new PGlite(dataDir);

function normalizeResult(result) {
  // PGlite usa affectedRows; o servidor original foi escrito para pg, que usa rowCount.
  // Normalizamos aqui para manter compatibilidade com todas as rotas.
  if (result && result.rowCount == null) {
    result.rowCount = Array.isArray(result.rows) ? result.rows.length : (result.affectedRows ?? 0);
  }
  return result;
}

async function query(sql, params = []) {
  return normalizeResult(await db.query(sql, params));
}

export const pool = {
  query,
  async connect() {
    // Mantém compatibilidade com a API que o servidor já usa.
    return {
      query,
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
    const client = { query: async (sql, params = []) => normalizeResult(await trx.query(sql, params)), release() {} };
    return fn(client);
  });
}
