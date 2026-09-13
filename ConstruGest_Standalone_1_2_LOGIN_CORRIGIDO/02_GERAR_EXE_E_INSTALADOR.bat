@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ConstruGest - Gerar EXE
cls
echo ==================================================
echo   GERANDO CONSTRUGEST DESKTOP STANDALONE 1.1
 echo ==================================================
echo.
if not exist node_modules (
 echo [ERRO] Execute primeiro 01_INSTALAR_DEPENDENCIAS.bat
 pause
 exit /b 1
)
call npm run build:all
if errorlevel 1 (
 echo.
 echo [ERRO] A compilacao nao terminou.
 echo Tire um print desta tela e envie no ChatGPT.
 pause
 exit /b 1
)
echo.
echo [OK] EXE criado com sucesso.
echo Abrindo a pasta dist...
start "" "%~dp0dist"
pause
