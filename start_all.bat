@echo off
echo Starting xAutomator server...
start cmd /k "cd projects\xAutomator_server && go run main.go"

echo Starting proxy checker backend...
start cmd /k "cd projects\proxy_checker_backend && npm run dev"

echo Starting wallets checker...
start cmd /k "cd projects\wallets_checker && go run main.go"

echo Starting React frontend...
start cmd /k "npm run dev"

echo All services have been started! 

pause