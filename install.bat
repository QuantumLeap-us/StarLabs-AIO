@echo off
echo Installing dependencies for all projects...

echo Installing React frontend dependencies...
call npm install

echo Installing proxy checker backend dependencies...
cd projects\proxy_checker_backend
call npm install
cd ..\..

echo Installing Go dependencies for xAutomator server...
cd projects\xAutomator_server
call go mod download
cd ..\..

echo Installing Go dependencies for wallets checker...
cd projects\wallets_checker
call go mod download
cd ..\..

echo All dependencies have been installed! 

pause