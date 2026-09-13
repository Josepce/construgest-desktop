@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ConstruGest Desktop Standalone - Teste
if not exist node_modules (
 echo Execute primeiro 01_INSTALAR_DEPENDENCIAS.bat
 pause
 exit /b 1
)
call npm run desktop
pause
