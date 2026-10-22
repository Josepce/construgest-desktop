const fs=require('fs');
const path=require('path');
const os=require('os');
const assert=require('assert');
(async()=>{
  const {createRecoverySecurity}=await import('../src/recovery-security.js');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'porto-prime-recovery-'));
  try{
    const security=createRecoverySecurity(dir);
    const code=security.ensureCode();
    assert.match(code,/^[A-F0-9]{32}$/);
    assert.equal(security.verify(code),true);
    assert.equal(security.verify(code.toLowerCase()),true);
    assert.equal(security.verify('0'.repeat(32)),false);
    assert.equal(security.verify(''),false);
    assert.equal(security.verify(null),false);
    assert.equal(createRecoverySecurity(dir).ensureCode(),code,'código não deve mudar ao reiniciar');
    assert.equal(fs.existsSync(security.codePath),true);
    console.log('OK: segredo local de recuperação é persistente e verificado sem exposição pela API.');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exit(1)});
