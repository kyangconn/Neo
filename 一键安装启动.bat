@echo off
title Whale Play Setup
pushd "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
pause
popd
