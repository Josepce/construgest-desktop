const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
async function startServer(){
  const dataDir = path.join(app.getPath('userData'), 'database');
  fs.mkdirSync(dataDir,{recursive:true});
  process.env.ELECTRON_DATA_DIR = dataDir;
  process.env.PORT = '3210';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'construgest-desktop-local-session-key';
  try {
    await import('./src/server.js');
  } catch (e) {
    console.error(e);
    dialog.showErrorBox('ConstruGest', 'Não foi possível iniciar o banco local.\n\nDetalhes: ' + (e && e.message ? e.message : e));
    throw e;
  }
}
function createWindow(){
  win=new BrowserWindow({width:1440,height:900,minWidth:1050,minHeight:680,autoHideMenuBar:true,title:'ConstruGest Desktop',webPreferences:{contextIsolation:true,nodeIntegration:false}});
  let tries=0;
  const timer=setInterval(async()=>{
    tries++;
    try { await fetch('http://127.0.0.1:3210'); clearInterval(timer); win.loadURL('http://127.0.0.1:3210'); }
    catch(e){ if(tries>80){ clearInterval(timer); win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent('<h2>ConstruGest não iniciou</h2><p>Feche o programa e tente novamente.</p>')); } }
  },250);
}
app.whenReady().then(async()=>{ try { await startServer(); createWindow(); } catch { app.quit(); } });
app.on('window-all-closed',()=>{ if(process.platform!=='darwin') app.quit(); });
