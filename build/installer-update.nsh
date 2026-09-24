!include "FileFunc.nsh"

!macro customInit
  ; Porto Prime - atualizacao segura e compativel com ConstruGest.
  ; Fecha o aplicativo e cria uma copia de seguranca do banco antes de substituir os binarios.
  ; Se o backup nao puder ser confirmado, a atualizacao e interrompida.

  MessageBox MB_OKCANCEL|MB_ICONINFORMATION "Porto Prime - Atualizacao Segura. Feche o Porto Prime/ConstruGest nos outros computadores antes de continuar. Uma copia de seguranca sera criada e verificada antes da instalacao." IDOK +2
  Abort

  nsExec::ExecToLog '"$SYSDIR\taskkill.exe" /IM "ConstruGest.exe" /T /F'
  nsExec::ExecToLog '"$SYSDIR\taskkill.exe" /IM "Porto Prime.exe" /T /F'
  Sleep 1200

  ${GetTime} "" "L" $0 $1 $2 $3 $4 $5 $6
  StrCpy $7 "$0$1$2-$4$5$6"

  ; Caminho usado pelas versoes atuais do ConstruGest.
  IfFileExists "$APPDATA\construgest-desktop-standalone\database\*.*" 0 +5
    CreateDirectory "$APPDATA\construgest-desktop-standalone\backups\pre-update-$7"
    nsExec::ExecToLog '"$SYSDIR\cmd.exe" /C xcopy "$APPDATA\construgest-desktop-standalone\database" "$APPDATA\construgest-desktop-standalone\backups\pre-update-$7\database" /E /I /H /Y /Q'
    IfFileExists "$APPDATA\construgest-desktop-standalone\backups\pre-update-$7\database\*.*" 0 backup_failed
    Goto backup_ok

  ; Compatibilidade caso o userData esteja usando productName em alguma instalacao.
  IfFileExists "$APPDATA\ConstruGest\database\*.*" 0 +5
    CreateDirectory "$APPDATA\ConstruGest\backups\pre-update-$7"
    nsExec::ExecToLog '"$SYSDIR\cmd.exe" /C xcopy "$APPDATA\ConstruGest\database" "$APPDATA\ConstruGest\backups\pre-update-$7\database" /E /I /H /Y /Q'
    IfFileExists "$APPDATA\ConstruGest\backups\pre-update-$7\database\*.*" 0 backup_failed
    Goto backup_ok

  ; Caminho nativo de novas instalacoes Porto Prime.
  IfFileExists "$APPDATA\Porto Prime\database\*.*" 0 +5
    CreateDirectory "$APPDATA\Porto Prime\backups\pre-update-$7"
    nsExec::ExecToLog '"$SYSDIR\cmd.exe" /C xcopy "$APPDATA\Porto Prime\database" "$APPDATA\Porto Prime\backups\pre-update-$7\database" /E /I /H /Y /Q'
    IfFileExists "$APPDATA\Porto Prime\backups\pre-update-$7\database\*.*" 0 backup_failed
    Goto backup_ok

  ; Nenhum banco local encontrado: instalacao nova.
  Goto backup_ok

backup_failed:
  MessageBox MB_OK|MB_ICONSTOP "Porto Prime - Atualizacao cancelada. Nao foi possivel confirmar o backup do banco de dados. Nenhum arquivo do programa sera substituido. Verifique espaco em disco e permissoes e tente novamente."
  Abort

backup_ok:
!macroend
