# --- CONFIGURACOES ---
$rede_matriz = "10.113.11."
# --- FIM DAS CONFIGURACOES ---

function Write-Log {
    param($Message)
    $logPath = "C:\Scripts\vpn_log.txt"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] $Message" | Out-File -FilePath $logPath -Append
}

Write-Log "--- Verificacao iniciada ---"

# 1. ESTOU NA REDE DA MATRIZ?
$ips_locais = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -like "$rede_matriz*" }
if ($null -ne $ips_locais) {
    Write-Log "Detectado na rede da matriz ($($ips_locais.IPAddress)). Garantindo que o servico VPN esteja parado."
    Stop-Service -Name "OpenVPNService" -Force -ErrorAction SilentlyContinue
    Write-Log "Comando para PARAR o servico enviado. Finalizando script."
    exit
}

Write-Log "Fora da rede da matriz. Verificando proximas condicoes."

# 2. A VPN JA ESTA ATIVA?
$adaptador_vpn = Get-NetAdapter | Where-Object { $_.InterfaceDescription -like "*TAP-Windows*" -and $_.Status -eq "Up" }
if ($null -ne $adaptador_vpn) {
    Write-Log "O adaptador VPN ja esta ativo (Up). Nenhuma acao necessaria."
    exit
}

Write-Log "Adaptador VPN nao esta ativo. Prosseguindo."

# 3. HA CONEXAO COM A INTERNET?
$tem_internet = Test-NetConnection -ComputerName 8.8.8.8 -Port 53 -WarningAction SilentlyContinue
if (-not $tem_internet.TcpTestSucceeded) {
    Write-Log "Nao ha conexao com a internet. Nao e possivel conectar a VPN."
    exit
}

Write-Log "Internet OK. Enviando comando para INICIAR o servico VPN."
Start-Service -Name "OpenVPNService" -ErrorAction SilentlyContinue
Write-Log "Comando para INICIAR o servico enviado. Finalizando script."
