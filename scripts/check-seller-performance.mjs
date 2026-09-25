import fs from 'fs';
import {PGlite} from '@electric-sql/pglite';
import {getSellerPerformance,validateMonthKey} from '../src/seller-performance.js';

const db=new PGlite();
await db.exec(fs.readFileSync(new URL('../src/schema.sql',import.meta.url),'utf8'));
await db.exec(`
INSERT INTO users(name,email,password_hash,role,active) VALUES
('Ana','ana@local','x','Vendedor',true),
('Bruno','bruno@local','x','Vendedor',true);
INSERT INTO seller_targets(user_id,month_key,target_amount,commission_percent) VALUES
(1,'2026-09',1000,2.5),
(2,'2026-09',500,5);
INSERT INTO sales(user_id,seller_id,status,payment_method,total,cmv,created_at) VALUES
(1,1,'FINALIZADA','PIX',800,400,'2026-09-05T10:00:00Z'),
(1,1,'FINALIZADA','PIX',300,150,'2026-09-10T10:00:00Z'),
(2,2,'FINALIZADA','Dinheiro',250,100,'2026-09-11T10:00:00Z'),
(2,2,'CANCELADA','PIX',999,100,'2026-09-12T10:00:00Z');
`);
const pool={query:(sql,params=[])=>db.query(sql,params)};
const r=await getSellerPerformance(pool,'2026-09');
const ana=r.sellers.find(x=>x.name==='Ana');
const bruno=r.sellers.find(x=>x.name==='Bruno');
if(!ana||!bruno)throw Error('Vendedores não encontrados.');
if(Math.abs(ana.sales_total-1100)>.001)throw Error('Faturamento de Ana incorreto.');
if(ana.sales!==2)throw Error('Quantidade de vendas de Ana incorreta.');
if(!ana.achieved||Math.abs(ana.progress_percent-110)>.001)throw Error('Meta de Ana deveria estar atingida em 110%.');
if(Math.abs(ana.commission_estimated-27.5)>.001)throw Error('Comissão de Ana incorreta.');
if(Math.abs(bruno.sales_total-250)>.001)throw Error('Venda cancelada entrou no faturamento de Bruno.');
if(Math.abs(bruno.commission_estimated-12.5)>.001)throw Error('Comissão de Bruno incorreta.');
if(Math.abs(r.summary.sales_total-1350)>.001)throw Error('Faturamento total da equipe incorreto.');
if(Math.abs(r.summary.target_amount-1500)>.001)throw Error('Meta total da equipe incorreta.');
let invalid=false;try{validateMonthKey('2026-13')}catch{invalid=true}
if(!invalid)throw Error('Validação do mês não rejeitou período inválido.');
console.log('OK: metas, atingimento e comissões de vendedores validados.');
await db.close();
