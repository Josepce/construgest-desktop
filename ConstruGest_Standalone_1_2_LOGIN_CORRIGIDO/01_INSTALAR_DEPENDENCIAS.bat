@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ConstruGest Desktop Standalone - Preparar
cls
echo ==================================================
echo   CONSTRUGEST DESKTOP STANDALONE 1.1
echo ==================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
 echo [ERRO] Node.js nao foi encontrado.
 echo Instale o Node.js LTS em https://nodejs.org e execute novamente.
 pause
 exit /b 1
)
echo Node encontrado:
node --version
echo.
echo Instalando dependencias. Isto pode demorar na primeira vez...
call npm install
if errorlevel 1 (
 echo.
 echo [ERRO] Nao foi possivel instalar as dependencias.
 echo Verifique sua internet e execute novamente.
 pause
 exit /b 1
)
echo.
echo [OK] Tudo preparado.
echo Agora execute: 02_GERAR_EXE_E_INSTALADOR.bat
pause
