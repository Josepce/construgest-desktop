import fs from 'fs';
import {PGlite} from '@electric-sql/pglite';
import {abcClassify,getStockIntelligence} from '../src/stock-intelligence.js';

const sample=abcClassify([
  {name:'A',revenue:800},{name:'B',revenue:150},{name:'C',revenue:50}
]);
if(sample[0].abc!=='A'||sample[1].abc!=='B'||sample[2].abc!=='C')throw Error('Curva ABC não respeitou 80/95%.');

const db=new PGlite();
await db.exec(fs.readFileSync(new URL('../src/schema.sql',import.meta.url),'utf8'));
await db.exec(`
INSERT INTO users(name,email,password_hash,role) VALUES('Admin','a@a.local','x','Administrador');
INSERT INTO products(code,name,category,stock,min_stock,max_stock,cost,retail,active) VALUES
('A01','Produto A','A',10,5,30,10,20,true),
('B01','Produto B','B',5,5,20,10,20,true),
('C01','Produto C','C',2,5,10,10,20,true),
('D01','Produto Parado','D',20,2,20,10,20,true);
INSERT INTO sales(user_id,status,payment_method,total,cmv,created_at) VALUES
(1,'FINALIZADA','PIX',800,400,current_date-interval '5 days'),
(1,'FINALIZADA','PIX',150,75,current_date-interval '5 days'),
(1,'FINALIZADA','PIX',50,25,current_date-interval '5 days');
INSERT INTO sale_items(sale_id,product_id,description,qty,unit_price,cost) VALUES
(1,1,'Produto A',40,20,10),
(2,2,'Produto B',7.5,20,10),
(3,3,'Produto C',2.5,20,10);
`);
const pool={query:(sql,params=[])=>db.query(sql,params)};
const r=await getStockIntelligence(pool,{days:90});
const byName=Object.fromEntries(r.products.map(x=>[x.name,x]));
if(byName['Produto A']?.abc!=='A')throw Error('Produto A deveria ser classe A.');
if(byName['Produto B']?.abc!=='B')throw Error('Produto B deveria ser classe B.');
if(byName['Produto C']?.abc!=='C')throw Error('Produto C deveria ser classe C.');
if(!r.dead_stock.some(x=>x.name==='Produto Parado'))throw Error('Produto parado não foi identificado.');
if(!(r.summary.dead_value>=200))throw Error('Capital parado não foi calculado.');
if(!r.replenishment.some(x=>x.name==='Produto C'))throw Error('Reposição inteligente não identificou produto com giro e estoque baixo.');
if(r.days!==90)throw Error('Período da inteligência de estoque incorreto.');
console.log('OK: Curva ABC, giro, capital parado e reposição inteligente validados.');
await db.close();
