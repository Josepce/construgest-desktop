!include "FileFunc.nsh"

!macro customInit
  ; Porto Prime - atualização segura e compatível com ConstruGest.
  ; Antes de substituir os binários, fecha o aplicativo e cria uma cópia física de segurança do banco.
  ; Se o backup não puder ser confirmado, a atualização é interrompida.

  MessageBox MB_OKCANCEL|MB_ICONINFORMATION "Porto Prime - Atualização Segura$$
$$
Feche o Porto Prime/ConstruGest nos outros computadores antes de continuar.$$
A atualização preservará banco de dados, configurações e logomarca.$$
Uma cópia de segurança será criada e verificada antes da instalação." IDOK +2
  Abort

  nsExec::ExecToLog '"$SYSDIR\taskkill.exe" /IM "ConstruGest.exe" /T /F'
  nsExec::ExecToLog '"$SYSDIR\taskkill.exe" /IM "Porto Prime.exe" /T /F'
  Sleep 1200

  ${GetTime} "" "L" $0 $1 $2 $3 $4 $5 $6
  StrCpy $7 "$0$1$2-$4$5$6"

  ; Caminho usado pelas versões atuais do ConstruGest.
  IfFileExists "$APPDATA\construgest-desktop-standalone\database\*.*" 0 +5
    CreateDirectory "$APPDATA\construgest-desktop-standalone\backups\pre-update-$7"
    nsExec::ExecToLog '"$SYSDIR\cmd.exe" /C xcopy "$APPDATA\construgest-desktop-standalone\database" "$APPDATA\construgest-desktop-standalone\backups\pre-update-$7\database\" /E /I /H /Y /Q'
    IfFileExists "$APPDATA\construgest-desktop-standalone\backups\pre-update-$7\database\*.*" 0 backup_failed
    Goto backup_ok

  ; Compatibilidade caso o userData esteja usando productName em alguma instalação.
  IfFileExists "$APPDATA\ConstruGest\database\*.*" 0 +5
    CreateDirectory "$APPDATA\ConstruGest\backups\pre-update-$7"
    nsExec::ExecToLog '"$SYSDIR\cmd.exe" /C xcopy "$APPDATA\ConstruGest\database" "$APPDATA\ConstruGest\backups\pre-update-$7\database\" /E /I /H /Y /Q'
    IfFileExists "$APPDATA\ConstruGest\backups\pre-update-$7\database\*.*" 0 backup_failed
    Goto backup_ok

  ; Caminho nativo de novas instalações Porto Prime.
  IfFileExists "$APPDATA\Porto Prime\database\*.*" 0 +5
    CreateDirectory "$APPDATA\Porto Prime\backups\pre-update-$7"
    nsExec::ExecToLog '"$SYSDIR\cmd.exe" /C xcopy "$APPDATA\Porto Prime\database" "$APPDATA\Porto Prime\backups\pre-update-$7\database\" /E /I /H /Y /Q'
    IfFileExists "$APPDATA\Porto Prime\backups\pre-update-$7\database\*.*" 0 backup_failed
    Goto backup_ok

  ; Nenhum banco local encontrado: instalação nova.
  Goto backup_ok

backup_failed:
  MessageBox MB_OK|MB_ICONSTOP "Porto Prime - Atualização cancelada$$
$$
Não foi possível confirmar o backup do banco de dados.$$
Nenhum arquivo do programa será substituído.$$
$$
Verifique espaço em disco e permissões e tente novamente."
  Abort

backup_ok:
!macroend
