const fs=require('fs');
const e=fs.readFileSync('electron-main.cjs','utf8');
const checks=[
  [e.includes('function databaseStats(dir)'), 'função de análise dos bancos locais ausente'],
  [e.includes('b.bytes-a.bytes||b.files-a.files||b.newest-a.newest'), 'seleção não prioriza banco mais completo'],
  [e.includes("legacyPackage=path.join(appData,'construgest-desktop-standalone')"), 'pasta legado principal ausente'],
  [e.includes("legacyProduct=path.join(appData,'ConstruGest')"), 'pasta ConstruGest ausente'],
  [e.includes("portoPrime=path.join(appData,'Porto Prime')"), 'pasta Porto Prime ausente'],
  [e.includes('Banco selecionado:'), 'diagnóstico da pasta selecionada ausente']
];
for(const [ok,msg] of checks)if(!ok)throw new Error('Seleção do banco local: '+msg);
console.log('OK: seleção segura do banco local validada.');
