const fs=require('fs');
const server=fs.readFileSync('src/server.js','utf8');
const app=fs.readFileSync('public/app.js','utf8');
const index=fs.readFileSync('public/index.html','utf8');
const packageJson=JSON.parse(fs.readFileSync('package.json','utf8'));
const checks=[
  [packageJson.version==='4.4.8','versão do pacote não foi atualizada para 4.4.8'],
  [server.includes("/api/auth/recovery-info"),'rota de informações de recuperação ausente'],
  [server.includes("/api/auth/recover-admin"),'rota de redefinição de senha ausente'],
  [server.includes("const localRequest=isLocalLoginRequest;"),'proteção de recuperação local ausente'],
  [server.includes("PASSWORD-RECOVERY"),'backup antes da recuperação ausente'],
  [server.includes("loginAttempts.clear()"),'limpeza do bloqueio de login ausente'],
  [!server.includes("applyEmergencyMasterUserReset")&&!server.includes("applyEmergencyMasterPasswordReset")&&!server.includes("applyEmergencyMasterReset446")&&!server.includes("applyEmergencyMasterReset447"),'reset automático de credenciais temporárias ainda existe'],
  [!server.includes("bcrypt.hash('master',12)"),'senha master temporária ainda é gerada automaticamente'],
  [server.includes('function loginGuard(req,res,next){let k=loginKey(req)')&&!server.includes('function loginGuard(req,res,next){if(isLocalLoginRequest(req))'),'proteção contra tentativas de login, inclusive locais, ausente'],
  [app.includes("togglePasswordRecovery"),'função de recuperação na interface ausente'],
  [app.includes("savePasswordRecovery"),'salvamento da nova senha ausente'],
  [index.includes("passwordRecoveryBox")&&index.includes("Recuperar acesso"),'botão de recuperação ausente'],
  [index.includes("PORTO PRIME 4.4.8")&&index.includes("style.css?v=4.4.8"),'interface ou cache não refletem a nova versão']
];
for(const [ok,msg] of checks)if(!ok)throw new Error('Porto Prime 4.4.8: '+msg);
console.log('OK: Porto Prime 4.4.8 — recuperação local disponível e resets automáticos de senha removidos.');
