import fs from 'fs';
import {PGlite} from '@electric-sql/pglite';

const server=fs.readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const electron=fs.readFileSync(new URL('../electron-main.cjs',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const schema=fs.readFileSync(new URL('../src/schema.sql',import.meta.url),'utf8');

const required=[
  ["local-only padrão",electron.includes("PORTO_PRIME_LAN==='1'?'0.0.0.0':'127.0.0.1'")],
  ["limite de tentativas de login",server.includes("loginAttempts=new Map()")&&server.includes("status(429)")],
  ["troca de senha inicial",server.includes("/api/auth/change-initial-password")&&schema.includes("force_change_password")],
  ["sanitização de custo",server.includes("productForUser")&&server.includes("delete x.cost")],
  ["restore valida colunas",server.includes("information_schema.columns")&&server.includes("coluna não autorizada")],
  ["cabeçalhos de segurança",server.includes("X-Content-Type-Options")&&server.includes("X-Frame-Options")],
  ["motor único de vendas",server.includes("async function finalizeSaleCore")&&server.includes("/api/sales-v42")&&server.includes("saleRoute")],
  ["integridade de backup",server.includes("integrity_sha256")&&server.includes("backupDigest")],
  ["versão 4.4.7",index.includes("4.4.7")]
];
for(const [name,ok] of required)if(!ok)throw Error('Falha de estabilidade 4.4.7: '+name);

const db=new PGlite();
await db.exec(schema);
const cols=await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='users'");
if(!cols.rows.some(x=>x.column_name==='force_change_password'))throw Error('Coluna force_change_password ausente.');
const mig=await db.query('SELECT version FROM schema_migrations');
if(!mig.rows.some(x=>Number(x.version)===420))throw Error('Versão de schema 420 não aplicada.');

console.log('OK: segurança e estabilidade Porto Prime 4.4.7 validadas.');
await db.close();
