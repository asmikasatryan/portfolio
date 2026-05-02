param(
    [Parameter(Mandatory = $false)]
    [string]$TriggerPath = ""
)

$ErrorActionPreference = "Stop"

function Test-IsExcludedSensitivePath {
    param(
        [Parameter(Mandatory = $false)]
        [string]$FullPath
    )

    if ([string]::IsNullOrWhiteSpace($FullPath)) {
        return $false
    }

    $name = Split-Path -Leaf $FullPath
    if ([string]::IsNullOrWhiteSpace($name)) {
        return $false
    }

    $lowerName = $name.ToLowerInvariant()
    $norm = $FullPath.Replace('/', '\').ToLowerInvariant()

    if ($lowerName -eq '.env') { return $true }
    if ($lowerName.StartsWith('.env.')) { return $true }
    if ($lowerName.EndsWith('.env')) { return $true }

    if ($norm -match '[\\/]secrets?[\\/]') { return $true }
    if ($norm -match '[\\/]\.env($|\\)') { return $true }

    if ($lowerName.Contains('secret')) {
        if ($lowerName -match '\.(ts|tsx|js|jsx|mjs|cjs)$') {
            return $false
        }
        return $true
    }

    return $false
}

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Args
    )

    $output = & git @Args 2>&1
    $exitCode = $LASTEXITCODE

    return @{
        Output = ($output | Out-String).Trim()
        ExitCode = $exitCode
    }
}

function Get-RepoNameFromUrl {
    param([string]$Url)

    if ([string]::IsNullOrWhiteSpace($Url)) {
        return ""
    }

    $clean = $Url -replace "\.git$", ""
    $clean = $clean -replace "git@github\.com:", "https://github.com/"

    return $clean
}

$resolvedTriggerPath = ""
if (-not [string]::IsNullOrWhiteSpace($TriggerPath)) {
    $resolvedTriggerPath = $TriggerPath.Trim()
} elseif ($args.Count -gt 0 -and -not [string]::IsNullOrWhiteSpace($args[0])) {
    $resolvedTriggerPath = $args[0].Trim()
} else {
    $stdinText = ""
    if ([Console]::IsInputRedirected) {
        try {
            $stdinText = [Console]::In.ReadToEnd()
        } catch {
            $stdinText = ""
        }
    }
    if (-not [string]::IsNullOrWhiteSpace($stdinText)) {
        try {
            $json = $stdinText | ConvertFrom-Json
            if ($null -ne $json.file_path) {
                $resolvedTriggerPath = [string]$json.file_path
            }
        } catch {
            $resolvedTriggerPath = ""
        }
    }
}

if (Test-IsExcludedSensitivePath -FullPath $resolvedTriggerPath) {
    Write-Host "=== confirm-sync-deploy ==="
    Write-Host "Skipped: trigger path is .env or a secret/sensitive file (no prompt, no sync)."
    exit 0
}

Write-Host "=== confirm-sync-deploy ==="

# Preconditions
$insideRepo = Invoke-Git -Args @("rev-parse", "--is-inside-work-tree")
if ($insideRepo.ExitCode -ne 0 -or $insideRepo.Output -ne "true") {
    Write-Host "Abort: Git repository is not initialized."
    exit 1
}

$branchResult = Invoke-Git -Args @("symbolic-ref", "--short", "-q", "HEAD")
if ($branchResult.ExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($branchResult.Output)) {
    Write-Host "Abort: HEAD is detached."
    exit 1
}
$branch = $branchResult.Output
Write-Host "Branch: $branch"

$remoteResult = Invoke-Git -Args @("remote", "get-url", "origin")
if ($remoteResult.ExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($remoteResult.Output)) {
    Write-Host "Abort: remote origin is not configured."
    exit 1
}
$repoUrl = Get-RepoNameFromUrl -Url $remoteResult.Output
Write-Host "GitHub: $repoUrl"

$hasVercelLink = Test-Path ".vercel/project.json"

# 1) Check for changes
$statusResult = Invoke-Git -Args @("status", "--porcelain")
if ($statusResult.ExitCode -ne 0) {
    Write-Host "Abort: failed to read git status."
    exit 1
}

if ([string]::IsNullOrWhiteSpace($statusResult.Output)) {
    Write-Host "No changes detected. Exiting."
    exit 0
}

# Confirm before GitHub push / Vercel-related steps (nothing staged or committed yet)
while ($true) {
    $response = (Read-Host "Proceed with GitHub sync and Vercel deploy? (yes/no)").Trim().ToLowerInvariant()
    if ($response -eq "yes") {
        break
    }
    if ($response -eq "no") {
        Write-Host "Aborted: GitHub sync and deployment cancelled."
        exit 0
    }
    Write-Host "Please answer 'yes' or 'no'."
}

# 2) Stage all files
$addResult = Invoke-Git -Args @("add", ".")
if ($addResult.ExitCode -ne 0) {
    Write-Host "Abort: git add failed."
    Write-Host $addResult.Output
    exit 1
}

# 3) Commit changes
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$message = "chore(confirm): update $timestamp"
$commitResult = Invoke-Git -Args @("commit", "-m", $message)
if ($commitResult.ExitCode -ne 0) {
    if ($commitResult.Output -match "nothing to commit") {
        Write-Host "Nothing to commit after staging. Exiting."
        exit 0
    }

    Write-Host "Abort: git commit failed."
    Write-Host $commitResult.Output
    exit 1
}

# 4) Push to GitHub (retry once)
$pushSucceeded = $false
for ($i = 1; $i -le 2; $i++) {
    if ($i -eq 1) {
        $pushResult = Invoke-Git -Args @("push", "-u", "origin", "HEAD")
    } else {
        $pushResult = Invoke-Git -Args @("push", "origin", "HEAD")
    }
    if ($pushResult.ExitCode -eq 0) {
        $pushSucceeded = $true
        break
    }

    if ($i -eq 1) {
        Write-Host "Push failed, retrying once..."
        Start-Sleep -Seconds 2
    } else {
        Write-Host "Abort: git push failed after retry."
        Write-Host $pushResult.Output
        exit 1
    }
}

if (-not $pushSucceeded) {
    Write-Host "Abort: push did not complete."
    exit 1
}

# 5) Deployment
$deploymentUrl = ""
Write-Host "Deployment: push completed, relying on Vercel GitHub auto-deploy."

$vercelCmd = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $hasVercelLink) {
    Write-Host "Vercel link missing (.vercel/project.json). Skipping deployment check."
} elseif ($null -ne $vercelCmd) {
    # Best-effort check: if latest deployment list does not appear to include HEAD, run fallback.
    $shaResult = Invoke-Git -Args @("rev-parse", "--short", "HEAD")
    $sha = $shaResult.Output
    $listOutput = (& vercel ls 2>&1 | Out-String)

    if ($listOutput -notmatch [Regex]::Escape($sha)) {
        Write-Host "Auto-deploy not detected yet, running fallback: vercel --prod"
        $deployOutput = (& vercel --prod --yes 2>&1 | Out-String)
        if ($LASTEXITCODE -eq 0) {
            $urlMatch = [regex]::Match($deployOutput, "https://[a-zA-Z0-9._/-]+\.vercel\.app")
            if ($urlMatch.Success) {
                $deploymentUrl = $urlMatch.Value
            }
            Write-Host "Fallback deployment started."
        } else {
            Write-Host "Fallback deployment command failed."
            Write-Host $deployOutput.Trim()
        }
    } else {
        Write-Host "Auto-deploy appears to be queued/running."
    }
} else {
    Write-Host "Vercel CLI not found in PATH. Check deployment in Vercel dashboard."
}

if ([string]::IsNullOrWhiteSpace($deploymentUrl)) {
    Write-Host "Vercel deployment URL: pending (check Vercel dashboard)."
} else {
    Write-Host "Vercel deployment URL: $deploymentUrl"
}

Write-Host "Deployment started."
exit 0
