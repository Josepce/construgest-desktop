const fs=require('fs');
const s=fs.readFileSync('src/server.js','utf8');

function count(text){return s.split(text).length-1}
const checks=[
  [count('async function boot()')===1,'boot() deve existir exatamente uma vez'],
  [count("Rota não encontrada.")===1,'rota 404 deve existir exatamente uma vez'],
  [s.includes("let ps=cols.map((_,i)=>'$'+(i+1)).join(',');"),'placeholders do restore estão íntegros'],
  [s.includes("app.post('/api/backup/restore'"),'rota de restauração existe'],
  [s.includes("boot().catch(e=>{console.error(e);process.exit(1)})"),'inicialização final existe'],
  [!s.includes("ps=cols.map((_,i)=>'\napp.use"),'não há código injetado dentro da string de placeholders']
];
for(const [ok,msg] of checks)if(!ok)throw new Error('Integridade do server.js: '+msg);
console.log('OK: integridade estrutural do server.js validada.');
