# Low-level save: avoids `git commit` (Git 2.29 + Cursor trailer injection).
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..

$git = 'C:\Program Files\Git\mingw64\bin\git.exe'
$msg = 'feat(about): add browser TTS listen with female voice preference'

& $git add README.md src/components/AboutMe/consts.ts src/components/AboutMe/index.tsx src/components/AboutMe/styles.module.css src/components/TechnicalSkills/consts.ts src/services/browserSpeechTts.ts

$tree = & $git write-tree
if (-not $tree) { throw 'write-tree failed' }

$parent = & $git rev-parse HEAD
$newCommit = & $git commit-tree $tree -p $parent -m $msg
if (-not $newCommit) { throw 'commit-tree failed' }

& $git update-ref refs/heads/main $newCommit
Write-Output "Committed $newCommit on main"
