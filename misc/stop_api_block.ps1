Get-NetTCPConnection -State Listen -LocalPort 3000,4200 |
  Select-Object LocalPort,OwningProcess

Stop-Process -Id <PID> -Force