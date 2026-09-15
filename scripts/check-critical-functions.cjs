const fs=require('fs');const s=fs.readFileSync('public/app.js','utf8');
const required=['novoOrcamento','orcamentosSalvos','saveQuotePro','editSavedQuote','viewQuote','duplicateQuote','cancelQuote','confirmConvertQuote','financeiro','filterFinance','saveFin','payFin','cancelFin','pdv'];
const missing=required.filter(n=>!new RegExp('(?:async\\s+)?function\\s+'+n+'\\b').test(s));
if(missing.length){console.error('ERRO: funções críticas ausentes:',missing.join(', '));process.exit(1)}
console.log('OK: funções críticas presentes:',required.join(', '));