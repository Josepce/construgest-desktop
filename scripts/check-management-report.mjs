import fs from 'fs';
import {PGlite} from '@electric-sql/pglite';
import {getManagementReport,validateManagementPeriod} from '../src/management-report.js';

const db=new PGlite();
const schema=fs.readFileSync(new URL('../src/schema.sql',import.meta.url),'utf8');
await db.exec(schema);

await db.exec(`
INSERT INTO users(name,email,password_hash,role) VALUES('Administrador','admin@teste.local','x','Administrador');
INSERT INTO customers(name) VALUES('Cliente Teste');
INSERT INTO suppliers(name) VALUES('Fornecedor Teste');
INSERT INTO products(code,name,category,stock,min_stock,cost,retail,active) VALUES('001','Produto Teste','Ferragens',10,2,5,10,true);
INSERT INTO sales(customer_id,user_id,status,payment_method,total,cmv,created_at) VALUES(1,1,'FINALIZADA','PIX',100,60,'2026-09-20 10:00:00');
INSERT INTO sale_items(sale_id,product_id,description,qty,unit_price,cost) VALUES(1,1,'Produto Teste',10,10,5);
INSERT INTO sale_payments(sale_id,method,amount) VALUES(1,'PIX',100);
INSERT INTO purchases(supplier_id,user_id,status,total,created_at) VALUES(1,1,'RECEBIDA',40,'2026-09-18 10:00:00');
INSERT INTO financial_entries(kind,description,amount,status,paid_at,created_at) VALUES
('RECEBER','Recebimento',100,'PAGO','2026-09-20 10:00:00','2026-09-20 10:00:00'),
('PAGAR','Pagamento',30,'PAGO','2026-09-21 10:00:00','2026-09-21 10:00:00'),
('RECEBER','Pendente receber',20,'PENDENTE',NULL,'2026-09-22 10:00:00'),
('PAGAR','Pendente pagar',15,'PENDENTE',NULL,'2026-09-22 10:00:00');
`);

validateManagementPeriod('2026-09-01','2026-09-30');
let invalid=false;try{validateManagementPeriod('2026-99-01','2026-09-30')}catch{invalid=true}
if(!invalid)throw Error('Validação de período inválido falhou.');

const pool={query:(sql,params=[])=>db.query(sql,params)};
const r=await getManagementReport(pool,'2026-09-01','2026-09-30');
const checks=[
  [r.metrics.revenue===100,'faturamento'],
  [r.metrics.gross===40,'lucro'],
  [r.daily.length===1,'vendas por dia'],
  [r.payments[0]?.method==='PIX'&&r.payments[0]?.total===100,'pagamentos'],
  [r.products[0]?.description==='Produto Teste','produtos'],
  [r.customers[0]?.name==='Cliente Teste','clientes'],
  [r.purchases.total===40,'compras'],
  [r.suppliers[0]?.name==='Fornecedor Teste','fornecedores'],
  [r.categories[0]?.name==='Ferragens','categorias'],
  [r.financial.income===100&&r.financial.outflow===30,'financeiro realizado'],
  [r.financial.receivable===20&&r.financial.payable===15,'financeiro pendente'],
  [r.recent_sales.length===1,'vendas recentes'],
  [r.monthly.length===12,'histórico 12 meses']
];
for(const [ok,name] of checks)if(!ok)throw Error('Falha no relatório: '+name);
console.log('OK: Relatórios Gerenciais validados no PGlite com dados reais de teste.');
await db.close();
