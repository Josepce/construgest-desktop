const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert');
(async()=>{
  const {createTrialManager}=await import('../src/trial-license.js');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'porto-prime-trial-'));let clock=Date.parse('2026-09-20T12:00:00.000Z');
  const manager=createTrialManager({directory:dir,machineId:'TESTE123',now:()=>clock});
  assert.equal(manager.status().available,true);
  let started=manager.start();assert.equal(started.active,true);assert.equal(started.daysRemaining,7);
  clock+=6*24*60*60*1000;assert.equal(manager.status().daysRemaining,1);
  clock+=24*60*60*1000;let expired=manager.status();assert.equal(expired.active,false);assert.equal(expired.expired,true);
  assert.equal(manager.start().active,false);
  fs.unlinkSync(manager.trialFile);assert.equal(manager.status().used,true);assert.equal(manager.status().available,false);
  fs.rmSync(dir,{recursive:true,force:true});
  console.log('OK: demonstração de 7 dias, expiração e bloqueio de reinício validados.');
})().catch(e=>{console.error(e);process.exit(1)});
