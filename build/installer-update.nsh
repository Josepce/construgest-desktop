!include "FileFunc.nsh"

!macro customInit
  ; Porto Prime 4.1.1 - atualização segura e compatível com ConstruGest.
  ; O appId legado é preservado nesta transição para favorecer o reconhecimento da instalação anterior; a identidade visual passa a Porto Prime.
  ; Antes de substituir os binários, fecha o aplicativo e cria uma cópia física de segurança do PGlite.
  MessageBox MB_OKCANCEL|MB_ICONINFORMATION "Porto Prime - Atualização Segura$\r$\n$\r$\nFeche o Porto Prime/ConstruGest nos outros computadores antes de continuar.$\r$\nA atualização preservará banco de dados, configurações e logomarca.$\r$\nUma cópia de segurança será criada antes da instalação." IDOK +2
  Abort

  nsExec::ExecToLog '"$SYSDIR\\taskkill.exe" /IM "ConstruGest.exe" /T /F'
  nsExec::ExecToLog '"$SYSDIR\\taskkill.exe" /IM "Porto Prime.exe" /T /F'
  Sleep 1200

  ${GetTime} "" "L" $0 $1 $2 $3 $4 $5 $6
  StrCpy $7 "$0$1$2-$4$5$6"

  ; Caminho usado pelas versões atuais do ConstruGest.
  IfFileExists "$APPDATA\\construgest-desktop-standalone\\database\\*.*" 0 +3
    CreateDirectory "$APPDATA\\construgest-desktop-standalone\\backups\\pre-update-$7"
    nsExec::ExecToLog '"$SYSDIR\\cmd.exe" /C xcopy "$APPDATA\\construgest-desktop-standalone\\database" "$APPDATA\\construgest-desktop-standalone\\backups\\pre-update-$7\\database\\" /E /I /H /Y /Q'

  ; Compatibilidade caso o userData esteja usando productName em alguma instalação.
  IfFileExists "$APPDATA\\ConstruGest\\database\\*.*" 0 +3
    CreateDirectory "$APPDATA\\ConstruGest\\backups\\pre-update-$7"
    nsExec::ExecToLog '"$SYSDIR\\cmd.exe" /C xcopy "$APPDATA\\ConstruGest\\database" "$APPDATA\\ConstruGest\\backups\\pre-update-$7\\database\\" /E /I /H /Y /Q'

  ; Caminho nativo de novas instalações Porto Prime.
  IfFileExists "$APPDATA\\Porto Prime\\database\\*.*" 0 +3
    CreateDirectory "$APPDATA\\Porto Prime\\backups\\pre-update-$7"
    nsExec::ExecToLog '"$SYSDIR\\cmd.exe" /C xcopy "$APPDATA\\Porto Prime\\database" "$APPDATA\\Porto Prime\\backups\\pre-update-$7\\database\\" /E /I /H /Y /Q'
!macroend
