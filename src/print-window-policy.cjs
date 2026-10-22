// Politica de abertura: apenas janelas vazias criadas pela aplicacao para impressao.
function printWindowPolicy({url}={}){
  if(url==='about:blank')return {
    action:'allow',
    overrideBrowserWindowOptions:{
      webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,webviewTag:false}
    }
  };
  return {action:'deny'};
}
function securePrintWindow(child){
  child.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  child.webContents.on('will-navigate',(event,url)=>{
    if(url!=='about:blank')event.preventDefault();
  });
}
module.exports={printWindowPolicy,securePrintWindow};
