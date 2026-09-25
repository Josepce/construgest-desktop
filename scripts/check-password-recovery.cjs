const fs=require('fs');
const server=fs.readFileSync('src/server.js','utf8');
const app=fs.readFileSync('public/app.js','utf8');
const index=fs.readFileSync('public/index.html','utf8');
const checks=[
  [server.includes("/api/auth/recovery-info"),'rota de informações de recuperação ausente'],
  [server.includes("/api/auth/recover-admin"),'rota de redefinição de senha ausente'],
  [server.includes("localRequest=req=>"),'proteção de recuperação local ausente'],
  [server.includes("PASSWORD-RECOVERY"),'backup antes da recuperação ausente'],
  [server.includes("loginAttempts.clear()"),'limpeza do bloqueio de login ausente'],
  [app.includes("openPasswordRecovery"),'função de recuperação na interface ausente'],
  [app.includes("savePasswordRecovery"),'salvamento da nova senha ausente'],
  [index.includes("Recuperar acesso"),'botão de recuperação ausente']
];
for(const [ok,msg] of checks)if(!ok)throw new Error('Recuperação de senha: '+msg);
console.log('OK: recuperação local de senha validada.');
