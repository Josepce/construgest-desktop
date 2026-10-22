import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CODE_FILE='porto-prime-recovery-code.txt';

// O segredo deve existir somente no diretório de dados local, nunca na interface HTTP.
export function createRecoverySecurity(directory){
  const codePath=path.join(directory,CODE_FILE);
  function ensureCode(){
    fs.mkdirSync(directory,{recursive:true});
    try{
      const existing=fs.readFileSync(codePath,'utf8').trim();
      if(/^[0-9a-f]{32}$/i.test(existing))return existing;
      throw Error('Arquivo de recuperação inválido. Contate o suporte antes de substituí-lo.');
    }catch(e){
      if(e.code!=='ENOENT')throw e;
      const fresh=crypto.randomBytes(16).toString('hex').toUpperCase();
      try{fs.writeFileSync(codePath,fresh+'\n',{encoding:'utf8',mode:0o600,flag:'wx'});return fresh;}
      catch(writeError){
        if(writeError.code==='EEXIST')return ensureCode();
        throw writeError;
      }
    }
  }
  function verify(value){
    if(typeof value!=='string'||!/^[0-9a-f]{32}$/i.test(value.trim()))return false;
    const a=Buffer.from(ensureCode(),'hex'),b=Buffer.from(value.trim(),'hex');
    return crypto.timingSafeEqual(a,b);
  }
  return {codePath,ensureCode,verify};
}
