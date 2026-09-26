const fs=require('fs');
const server=fs.readFileSync('src/server.js','utf8');
const app=fs.readFileSync('public/app.js','utf8');
const index=fs.readFileSync('public/index.html','utf8');
const checks=[
  [server.includes("/api/auth/recovery-info"),'rota de informações de recuperação ausente'],
  [server.includes("/api/auth/recover-admin"),'rota de redefinição de senha ausente'],
  [server.includes("const localRequest=isLocalLoginRequest;"),'proteção de recuperação local ausente'],
  [server.includes("PASSWORD-RECOVERY"),'backup antes da recuperação ausente'],
  [server.includes("loginAttempts.clear()"),'limpeza do bloqueio de login ausente'],
  [server.includes("applyEmergencyMasterReset447"),'reset definitivo 4.4.6 ausente'],
  [server.includes("bcrypt.hash('master',12)"),'senha temporária master não está sendo gerada'],
  [server.includes("if(isLocalLoginRequest(req))return next()"),'login local ainda pode ser bloqueado por tentativas'],
  [app.includes("togglePasswordRecovery"),'função de recuperação na interface ausente'],
  [app.includes("savePasswordRecovery"),'salvamento da nova senha ausente'],
  [index.includes("passwordRecoveryBox")&&index.includes("Recuperar acesso"),'botão de recuperação ausente']
];
for(const [ok,msg] of checks)if(!ok)throw new Error('Recuperação de senha: '+msg);
console.log('OK: recuperação local de senha validada.');
