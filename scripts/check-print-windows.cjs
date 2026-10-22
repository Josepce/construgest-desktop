const assert=require('node:assert/strict');
const fs=require('node:fs');
const {printWindowPolicy,securePrintWindow}=require('../src/print-window-policy.cjs');
const electron=fs.readFileSync('electron-main.cjs','utf8');
const app=fs.readFileSync('public/app.js','utf8');
assert.equal(printWindowPolicy({url:'about:blank'}).action,'allow');
for(const url of ['https://example.com','http://127.0.0.1:3210','file:///etc/passwd','javascript:alert(1)','data:text/html,test','']){
  assert.equal(printWindowPolicy({url}).action,'deny','navegação proibida: '+url);
}
const prefs=printWindowPolicy({url:'about:blank'}).overrideBrowserWindowOptions.webPreferences;
assert.equal(prefs.nodeIntegration,false);
assert.equal(prefs.contextIsolation,true);
assert.equal(prefs.sandbox,true);
let handler,navigation;
securePrintWindow({webContents:{
  setWindowOpenHandler(fn){handler=fn},
  on(event,fn){if(event==='will-navigate')navigation=fn}
}});
assert.equal(handler({url:'about:blank'}).action,'deny','janelas de impressão não abrem outras janelas');
for(const url of ['https://example.com','http://localhost:3210','file:///tmp/1']){
  let blocked=false;navigation({preventDefault(){blocked=true}},url);assert(blocked,'janela de impressão não deve navegar: '+url);
}
let blocked=false;navigation({preventDefault(){blocked=true}},'about:blank');assert.equal(blocked,false);
assert(electron.includes("setWindowOpenHandler(printWindowPolicy)"),'Electron não usa a política');
assert(electron.includes("on('did-create-window',securePrintWindow)"),'filhos não recebem proteção');
for(const feature of ['printReceipt','printQuote','printGerencialReport','printPriceTable']){
  assert(app.includes('function '+feature+'('),'impressão ausente: '+feature);
}
console.log('OK: janelas de impressão reabilitadas com navegação externa bloqueada.');
