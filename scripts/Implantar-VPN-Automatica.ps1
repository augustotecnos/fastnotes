# =================================================================================
# Script para implantar a automacao da VPN em massa
# Adaptado a partir de um instalador existente para distribuir o Verifica-VPN.ps1
# =================================================================================

function ExecutarEmMassa {
    param (
        $IPS,
        $PADRAO_IP,
        $CREDENCIAL_ENTRADA
    )

    $LOGS_COMPUTADORES_TEMP = @()

    foreach ($IP_ATUAL in $IPS) {
        try {
            $COMPUTADOR_ATUAL = [pscustomobject]@{
                "IP" = "$PADRAO_IP$IP_ATUAL"
                "NOME_COMPUTADOR" = "INDISPONIVEL"
                "STATUS" = "SEM_ACESSO"
                "USUARIO" = "INDISPONIVEL"
                "DATA_HORA" = (get-date).ToString('dd-MM-yyyy | HH:mm')
            }

            if(Test-Connection -ComputerName "$PADRAO_IP$IP_ATUAL" -Count 2 -ttl 50 -quiet){
                Write-Host "$PADRAO_IP$IP_ATUAL"
                Write-Host "|---- ESTÁ ACESSÍVEL: SIM" -BackgroundColor DarkBlue -ForegroundColor Cyan

                $COMPUTADOR_ATUAL.USUARIO = ExecutarComandoRemoto {(qwinsta) -replace '\s{2,22}', ',' | ConvertFrom-Csv | Where-Object {$_ -like "*Ativ*"} | Select-Object -ExpandProperty USERNAME} "" "$PADRAO_IP$IP_ATUAL" $CREDENCIAL_ENTRADA
                $COMPUTADOR_ATUAL.NOME_COMPUTADOR = ExecutarComandoRemoto {$env:COMPUTERNAME} "" "$PADRAO_IP$IP_ATUAL" $CREDENCIAL_ENTRADA
                $COMPUTADOR_ATUAL.STATUS = "VERIFICANDO"

                $caminhoRemotoScript = "\\$PADRAO_IP$IP_ATUAL\c$\Scripts\Verifica-VPN.ps1"
                $pastaRemota = "\\$PADRAO_IP$IP_ATUAL\c$\Scripts"
                $origemScriptLocal = "C:\DeployVPN\Verifica-VPN.ps1"

                Write-Host "Verificando se a automacao de VPN ja existe..."

                if ([bool](ChecarEndereco $caminhoRemotoScript) -eq $true) {
                    Write-Host "O script Verifica-VPN.ps1 ja existe na maquina remota." -BackgroundColor Green -ForegroundColor Black
                    $COMPUTADOR_ATUAL.STATUS = "JA_IMPLANTADO"
                } else {
                    Write-Host "Script nao encontrado. Iniciando implantacao..."

                    if ([bool](ChecarEndereco $pastaRemota) -eq $false) {
                        Write-Host "Criando pasta C:\Scripts na maquina remota."
                        CriarPasta $pastaRemota
                        Start-Sleep -Seconds 2
                    }

                    Write-Host "Copiando Verifica-VPN.ps1 para $pastaRemota"
                    CopiarArquivo $origemScriptLocal $pastaRemota
                    Start-Sleep -Seconds 2

                    if ([bool](ChecarEndereco $caminhoRemotoScript) -eq $true) {
                        Write-Host "Criando a Tarefa Agendada na maquina remota..."

                        $comandoCriarTarefa = {
                            $nomeTarefa = "Conexao Automatica VPN"
                            $caminhoScript = "C:\Scripts\Verifica-VPN.ps1"
                            $acao = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-ExecutionPolicy Bypass -File `"$caminhoScript`""
                            $gatilho = New-ScheduledTaskTrigger -AtLogon
                            $principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\System" -LogonType ServiceAccount -RunLevel Highest
                            $configuracoes = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Days 1)
                            Unregister-ScheduledTask -TaskName $nomeTarefa -Confirm:$false -ErrorAction SilentlyContinue
                            Register-ScheduledTask -TaskName $nomeTarefa -Action $acao -Trigger $gatilho -Principal $principal -Settings $configuracoes -Force
                        }

                        ExecutarComandoRemoto -COMANDO $comandoCriarTarefa -IP "$PADRAO_IP$IP_ATUAL" -CREDENCIAL $CREDENCIAL_ENTRADA

                        $COMPUTADOR_ATUAL.STATUS = "IMPLANTADO_COM_SUCESSO"
                        Write-Host "Implantacao concluida com sucesso!" -BackgroundColor DarkGreen -ForegroundColor White
                    } else {
                        $COMPUTADOR_ATUAL.STATUS = "ERRO_AO_COPIAR_SCRIPT"
                        Write-Host "ERRO: Nao foi possivel copiar o script para a maquina remota." -BackgroundColor Red
                    }
                }
            } else {
                Write-Host "$PADRAO_IP$IP_ATUAL  `n|---- NEM ACESSO!" -BackgroundColor Yellow -ForegroundColor Red
            }

            Write-Host "`n"
            Write-Host "`n"

            $LOGS_COMPUTADORES_TEMP += $COMPUTADOR_ATUAL
        } catch {
            Write-Host "Ocorreu um erro inesperado no processamento de $($COMPUTADOR_ATUAL.IP): $_" -BackgroundColor Red
            $COMPUTADOR_ATUAL.STATUS = "ERRO_INESPERADO"
            $LOGS_COMPUTADORES_TEMP += $COMPUTADOR_ATUAL
        }
    }

    return $LOGS_COMPUTADORES_TEMP
}

# Exemplo de fluxo principal simplificado
$pass = Get-Content "C:\temp\secure.txt" | ConvertTo-SecureString
$CREDENCIAL_ENTRADA = New-Object -TypeName System.Management.Automation.PSCredential("gruposepromo\augusto.santos",$pass)

$IPS = 6..200
$PADRAO_IP_MATRIZ = "10.113.11."
$ENDERECO_LOG_IMPLANTACAO = "C:\DeployVPN\LOG_IMPLANTACAO_VPN_$(Get-Date -Format 'dd-MM-yyyy').csv"

$LOGS_ALTERACAO = ExecutarEmMassa $IPS $PADRAO_IP_MATRIZ $CREDENCIAL_ENTRADA
RegistrarComputadoresAlterados $LOGS_ALTERACAO $ENDERECO_LOG_IMPLANTACAO

Write-Host "Processo finalizado. Verifique o log em: $ENDERECO_LOG_IMPLANTACAO"

