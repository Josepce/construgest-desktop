const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let win;
const singleInstance=app.requestSingleInstanceLock();
if(!singleInstance)app.quit();
app.on('second-instance',()=>{if(win&&!win.isDestroyed()){if(win.isMinimized())win.restore();win.focus()}});
function databaseStats(dir){
  try{
    const db=path.join(dir,'database');
    if(!fs.existsSync(db))return null;
    let files=0,bytes=0,newest=0;
    const walk=p=>{for(const name of fs.readdirSync(p)){const full=path.join(p,name),st=fs.statSync(full);newest=Math.max(newest,st.mtimeMs||0);if(st.isDirectory())walk(full);else{files++;bytes+=st.size||0}}};
    walk(db);
    return files?{dir,files,bytes,newest}:null;
  }catch(_){return null}
}
function selectUserDataPath(){
  // Porto Prime 4.4.1: quando houver mais de um banco legado, usa o banco mais completo.
  const appData=app.getPath('appData');
  const current=app.getPath('userData');
  const legacyPackage=path.join(appData,'construgest-desktop-standalone');
  const legacyProduct=path.join(appData,'ConstruGest');
  const portoPrime=path.join(appData,'Porto Prime');
  const candidates=[...new Set([current,legacyPackage,legacyProduct,portoPrime])];
  const found=candidates.map(databaseStats).filter(Boolean).sort((a,b)=>b.bytes-a.bytes||b.files-a.files||b.newest-a.newest);
  const chosen=found[0]?.dir||portoPrime;
  app.setPath('userData',chosen);
  try{
    fs.mkdirSync(chosen,{recursive:true});
    fs.appendFileSync(path.join(chosen,'porto-prime-startup.log'),`[${new Date().toISOString()}] Banco selecionado: ${chosen}\nCandidatos: ${found.map(x=>x.dir+' | '+x.files+' arquivos | '+x.bytes+' bytes').join(' ; ')||'nenhum banco existente'}\n\n`,'utf8');
  }catch(_){}
  return chosen;
}
selectUserDataPath();
function machineId(){
  try{
    if(process.platform==='win32'){
      const {execFileSync}=require('child_process');
      const out=execFileSync('reg',['query','HKLM\\SOFTWARE\\Microsoft\\Cryptography','/v','MachineGuid'],{encoding:'utf8',windowsHide:true});
      const m=out.match(/MachineGuid\s+REG_SZ\s+([^\r\n]+)/i); if(m?.[1])return crypto.createHash('sha256').update('PORTO-PRIME|'+m[1].trim()).digest('hex').slice(0,24).toUpperCase();
    }
  }catch(_){}
  const seed=[require('os').hostname(),process.platform,process.arch].join('|');
  return crypto.createHash('sha256').update('PORTO-PRIME|'+seed).digest('hex').slice(0,24).toUpperCase();
}
function logPath(){ return path.join(app.getPath('userData'),'porto-prime-startup.log'); }
function writeLog(label, err){
  try{const text=`[${new Date().toISOString()}] ${label}\n${err?.stack||err?.message||String(err||'')}\n\n`;fs.appendFileSync(logPath(),text,'utf8');}catch(_){}
}
function errorHtml(err){
  const detail=String(err?.stack||err?.message||err||'Erro desconhecido').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const lp=logPath().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return `<!doctype html><meta charset="utf-8"><title>Porto Prime - Diagnóstico</title><style>body{font-family:Segoe UI,Arial;background:#f5f7fb;color:#172033;padding:36px}.box{max-width:900px;margin:auto;background:white;border-radius:14px;padding:28px;box-shadow:0 8px 30px #0002}h1{color:#174ea6}pre{white-space:pre-wrap;background:#eef3fb;padding:16px;border-radius:8px;border:1px solid #ccd8ea}.path{font-family:monospace;background:#f4f4f4;padding:10px;border-radius:6px}</style><div class="box"><h1>Porto Prime não conseguiu iniciar</h1><p>O programa permaneceu aberto para mostrar o diagnóstico. Nenhum dado foi apagado.</p><h3>Detalhes técnicos</h3><pre>${detail}</pre><h3>Arquivo de diagnóstico</h3><div class="path">${lp}</div><p>Envie uma foto desta tela para identificarmos a causa.</p></div>`;
}
function createWindow(){if(win&&!win.isDestroyed())return win;win=new BrowserWindow({width:1440,height:900,minWidth:900,minHeight:620,autoHideMenuBar:true,title:'Porto Prime',webPreferences:{contextIsolation:true,nodeIntegration:false}});return win;}
async function startServer(){const dataDir=path.join(app.getPath('userData'),'database');fs.mkdirSync(dataDir,{recursive:true});process.env.ELECTRON_DATA_DIR=dataDir;process.env.PORTO_PRIME_LICENSE_DIR=app.getPath('userData');process.env.PORTO_PRIME_MACHINE_ID=machineId();process.env.PORT='3210';process.env.HOST=process.env.PORTO_PRIME_LAN==='1'?'0.0.0.0':'127.0.0.1';process.env.JWT_SECRET=process.env.JWT_SECRET||crypto.randomBytes(32).toString('hex');await import('./src/server.js');}
async function loadApp(){const w=createWindow();let tries=0;const timer=setInterval(async()=>{tries++;try{await fetch('http://127.0.0.1:3210');clearInterval(timer);w.loadURL('http://127.0.0.1:3210');}catch(e){if(tries>80){clearInterval(timer);writeLog('Servidor não respondeu na porta 3210',e);w.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(errorHtml(e)));}}},250);}
if(singleInstance)app.whenReady().then(async()=>{createWindow();try{await startServer();await loadApp();}catch(e){console.error(e);writeLog('Falha na inicialização',e);if(win&&!win.isDestroyed())win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(errorHtml(e)));else dialog.showErrorBox('Porto Prime - Diagnóstico','Falha na inicialização. Log: '+logPath()+'\n\n'+(e?.message||e));}});
process.on('uncaughtException',e=>writeLog('uncaughtException',e));process.on('unhandledRejection',e=>writeLog('unhandledRejection',e));app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
