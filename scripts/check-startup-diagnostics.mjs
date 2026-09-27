import fs from 'fs';
const server=fs.readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const electron=fs.readFileSync(new URL('../electron-main.cjs',import.meta.url),'utf8');
if(/boot\(\)\.catch\([^\n]*process\.exit/.test(server))throw Error('Servidor ainda encerra o processo em falha de boot.');
if(!server.includes('await boot();'))throw Error('Boot não está sendo aguardado pelo import do Electron.');
if(!server.includes("server.once('error',reject)"))throw Error('Falha de porta não é propagada ao Electron.');
if(!electron.includes("render-process-gone"))throw Error('Diagnóstico de renderer ausente.');
console.log('OK: falhas de boot permanecem visíveis no diagnóstico.');
