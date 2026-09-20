import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DAY_MS=24*60*60*1000;
const TRIAL_DAYS=7;
const INTEGRITY_KEY='PORTO_PRIME_TRIAL_INTEGRITY_V1_2026';

const sign=data=>crypto.createHmac('sha256',INTEGRITY_KEY).update(JSON.stringify(data)).digest('hex');
const protectedRecord=data=>({...data,signature:sign(data)});
const verifyRecord=record=>{
  if(!record||typeof record!=='object'||!record.signature)return false;
  const {signature,...data}=record;
  const expected=sign(data);
  try{return crypto.timingSafeEqual(Buffer.from(signature,'hex'),Buffer.from(expected,'hex'))}catch{return false}
};

export function createTrialManager({directory,machineId,now=()=>Date.now()}){
  const trialFile=path.join(directory,'porto-prime.trial.json');
  const guardFile=path.join(directory,'porto-prime.trial.guard');
  const atomicWrite=(file,value)=>{
    fs.mkdirSync(directory,{recursive:true});
    const tmp=file+'.tmp';
    fs.writeFileSync(tmp,JSON.stringify(value),'utf8');
    fs.renameSync(tmp,file);
  };
  const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
  const validForMachine=x=>verifyRecord(x)&&x.product==='PORTO_PRIME'&&x.v===1&&String(x.machineId||'').toUpperCase()===machineId;
  function unavailable(error,extra={}){return {active:false,accessMode:'trial',available:false,used:true,error,...extra}}
  function status({touch=true}={}){
    let record;
    try{record=read(trialFile)}catch{
      try{
        const guard=read(guardFile);
        if(validForMachine(guard))return unavailable('A demonstração gratuita já foi utilizada neste computador.',{expired:true,startedAt:guard.startedAt||null});
      }catch{}
      return {active:false,accessMode:'trial',available:true,used:false,daysTotal:TRIAL_DAYS};
    }
    if(!validForMachine(record))return unavailable('Os dados da demonstração estão inválidos ou foram alterados.',{tampered:true});
    const current=now(),startedAt=Date.parse(record.startedAt),expiresAt=Date.parse(record.expiresAt),lastSeenAt=Date.parse(record.lastSeenAt||record.startedAt);
    if(!Number.isFinite(startedAt)||!Number.isFinite(expiresAt)||expiresAt-startedAt!==TRIAL_DAYS*DAY_MS)return unavailable('Os dados da demonstração estão inválidos.',{tampered:true});
    if(current+5*60*1000<lastSeenAt)return unavailable('A data ou hora do computador foi alterada. Corrija-a para continuar.',{clockError:true,startedAt:record.startedAt,expiresAt:record.expiresAt});
    const expired=current>=expiresAt,remainingMs=Math.max(0,expiresAt-current),daysRemaining=expired?0:Math.max(1,Math.ceil(remainingMs/DAY_MS));
    if(!expired&&touch&&current-lastSeenAt>60*1000){
      const {signature,...data}=record; data.lastSeenAt=new Date(current).toISOString();
      atomicWrite(trialFile,protectedRecord(data));
    }
    return {active:!expired,accessMode:'trial',available:false,used:true,expired,daysTotal:TRIAL_DAYS,daysRemaining,startedAt:record.startedAt,expiresAt:record.expiresAt,error:expired?'Sua demonstração gratuita de 7 dias terminou. Seus dados estão preservados. Ative o Plano Comercial para continuar.':null};
  }
  function start(){
    const existing=status({touch:false});
    if(existing.used||existing.active)return existing;
    const current=now(),data={product:'PORTO_PRIME',v:1,machineId,startedAt:new Date(current).toISOString(),expiresAt:new Date(current+TRIAL_DAYS*DAY_MS).toISOString(),lastSeenAt:new Date(current).toISOString()};
    atomicWrite(trialFile,protectedRecord(data));
    atomicWrite(guardFile,protectedRecord({product:'PORTO_PRIME',v:1,machineId,startedAt:data.startedAt}));
    return status({touch:false});
  }
  return {status,start,trialFile,guardFile};
}

export const TRIAL_DURATION_DAYS=TRIAL_DAYS;
