const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert');
(async()=>{
  const {createTrialManager}=await import('../src/trial-license.js');
  function sandbox(){return fs.mkdtempSync(path.join(os.tmpdir(),'porto-prime-trial-'))}
  let clock=Date.parse('2026-09-20T12:00:00.000Z');
  const dir=sandbox(),manager=createTrialManager({directory:dir,machineId:'TESTE123',now:()=>clock});
  try{
    assert.equal(manager.status().available,true);
    let started=manager.start();assert.equal(started.active,true);assert.equal(started.daysRemaining,7);
    clock+=6*24*60*60*1000;assert.equal(manager.status().daysRemaining,1);
    clock+=24*60*60*1000;let expired=manager.status();assert.equal(expired.active,false);assert.equal(expired.expired,true);
    assert.equal(manager.start().active,false);
    fs.unlinkSync(manager.trialFile);assert.equal(manager.status().used,true);assert.equal(manager.status().available,false);
  }finally{fs.rmSync(dir,{recursive:true,force:true})}

  async function testTamper(name,mutate){
    const temp=sandbox();
    try{
      const m=createTrialManager({directory:temp,machineId:'TESTE123',now:()=>clock});
      assert.equal(m.start().active,true);
      mutate(m);
      const status=m.status();
      assert.equal(status.active,false,name+': acesso não deve continuar ativo');
      assert.equal(status.available,false,name+': teste não deve ser renovado');
      assert.equal(status.tampered,true,name+': adulteração deve ser identificada');
      assert.equal(m.start().active,false,name+': tentativa de reiniciar deve falhar');
    }finally{fs.rmSync(temp,{recursive:true,force:true})}
  }
  await testTamper('remoção da proteção',m=>fs.unlinkSync(m.guardFile));
  await testTamper('proteção corrompida',m=>fs.writeFileSync(m.guardFile,'{invalido','utf8'));
  await testTamper('proteção alterada',m=>{const x=JSON.parse(fs.readFileSync(m.guardFile,'utf8'));x.startedAt='2000-01-01T00:00:00.000Z';fs.writeFileSync(m.guardFile,JSON.stringify(x))});
  await testTamper('demonstração corrompida',m=>fs.writeFileSync(m.trialFile,'{invalido','utf8'));
  await testTamper('demonstração alterada',m=>{const x=JSON.parse(fs.readFileSync(m.trialFile,'utf8'));x.expiresAt='2099-01-01T00:00:00.000Z';fs.writeFileSync(m.trialFile,JSON.stringify(x))});
  console.log('OK: demonstração, expiração e detecção de registros adulterados validadas.');
})().catch(e=>{console.error(e);process.exit(1)});
