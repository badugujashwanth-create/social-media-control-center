[CmdletBinding()]
param(
  [string]$BaseUrl = 'http://127.0.0.1:3100',
  [switch]$UseExistingServices,
  [switch]$SkipBrowserInstall,
  [switch]$SmokeOnly,
  [switch]$AuditOnly,
  [string]$FfmpegPath = ''
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$webDir = Join-Path $repoRoot 'apps\web'
$demoDir = Join-Path $repoRoot 'docs\demo'
$verificationDir = Join-Path $demoDir 'verification'
[IO.Directory]::CreateDirectory($verificationDir) | Out-Null
$ownedProcesses = @()

function Stop-ProcessTree([int]$ProcessId) {
  $children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$ProcessId" -ErrorAction SilentlyContinue
  foreach ($child in $children) { Stop-ProcessTree -ProcessId $child.ProcessId }
  Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

function Resolve-Ffmpeg([string]$RequestedPath) {
  if ($RequestedPath) { return (Resolve-Path $RequestedPath).Path }
  if ($env:SMCC_FFMPEG) { return (Resolve-Path $env:SMCC_FFMPEG).Path }
  $installed = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if ($null -ne $installed) { return $installed.Source }
  $cache = Join-Path $env:TEMP 'workhub-ffmpeg-8.1.2'
  $cached = Get-ChildItem $cache -Recurse -Filter ffmpeg.exe -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -ne $cached) { return $cached.FullName }
  if ($null -eq (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'FFmpeg is unavailable and GitHub CLI is required for the pinned temporary download.'
  }
  [IO.Directory]::CreateDirectory($cache) | Out-Null
  $zip = Join-Path $cache 'ffmpeg-8.1.2-essentials_build.zip'
  if (-not (Test-Path -LiteralPath $zip)) {
    gh release download 8.1.2 -R GyanD/codexffmpeg -p 'ffmpeg-8.1.2-essentials_build.zip' -D $cache
    if ($LASTEXITCODE -ne 0) { throw 'Pinned FFmpeg download failed.' }
  }
  Expand-Archive -LiteralPath $zip -DestinationPath $cache -Force
  $cached = Get-ChildItem $cache -Recurse -Filter ffmpeg.exe | Select-Object -First 1
  if ($null -eq $cached) { throw 'The pinned FFmpeg archive did not contain ffmpeg.exe.' }
  return $cached.FullName
}

function Wait-ForDemo {
  for ($attempt = 0; $attempt -lt 120; $attempt += 1) {
    try {
      $api = Invoke-RestMethod -Uri 'http://127.0.0.1:8011/health' -TimeoutSec 2
      $web = Invoke-WebRequest -Uri "$BaseUrl/login" -UseBasicParsing -TimeoutSec 2
      if ($api.status -eq 'ok' -and $api.providers_contacted -eq $false -and $web.StatusCode -eq 200) { return }
    } catch {
      Start-Sleep -Seconds 1
    }
  }
  throw 'Demo services did not become healthy within 120 seconds.'
}

function New-Narration([string]$OutputPath) {
  Add-Type -AssemblyName System.Speech
  $paragraphs = (Get-Content -Raw -Encoding utf8 (Join-Path $demoDir 'NARRATION.md')) -split '(?:\r?\n){2,}' |
    Where-Object { $_ -and $_ -notmatch '^#' } |
    ForEach-Object { ($_ -replace '[`*_#]', '').Trim() }
  $builder = New-Object System.Speech.Synthesis.PromptBuilder
  foreach ($paragraph in $paragraphs) {
    $builder.AppendText($paragraph)
    $builder.AppendBreak([TimeSpan]::FromSeconds(2))
  }
  $voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
  try {
    $voice.Rate = -1
    $voice.Volume = 90
    $voice.SetOutputToWaveFile($OutputPath)
    $voice.Speak($builder)
  } finally {
    $voice.Dispose()
  }
}

$ffmpeg = Resolve-Ffmpeg $FfmpegPath
$ffprobe = Join-Path (Split-Path -Parent $ffmpeg) 'ffprobe.exe'
if (-not (Test-Path -LiteralPath $ffprobe)) { throw 'ffprobe.exe was not found beside FFmpeg.' }

try {
  if (-not $UseExistingServices) {
    $env:NEXT_PUBLIC_API_BASE = 'http://127.0.0.1:8011'
    $env:NEXT_PUBLIC_DEMO_MODE = 'true'
    $env:NEXT_PUBLIC_DEV_MODE = 'false'
    Push-Location $webDir
    try {
      npm run build
      if ($LASTEXITCODE -ne 0) { throw 'The frontend production build failed.' }
    } finally { Pop-Location }
    $ownedProcesses += Start-Process python -ArgumentList 'scripts/demo_api.py' -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru
    $ownedProcesses += Start-Process python -ArgumentList 'scripts/static_server.py' -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru
  }

  Wait-ForDemo
  Push-Location $repoRoot
  try {
    python scripts/verify_demo_workflow.py
    if ($LASTEXITCODE -ne 0) { throw 'The deterministic API workflow failed before browser work.' }
  } finally { Pop-Location }

  $recordingStartedAt = Get-Date
  $env:DEMO_BASE_URL = $BaseUrl.TrimEnd('/')
  $env:DEMO_FAST = if ($SmokeOnly -or $AuditOnly) { 'true' } else { 'false' }
  Push-Location $webDir
  try {
    if (-not $SkipBrowserInstall) {
      npm exec playwright install chromium
      if ($LASTEXITCODE -ne 0) { throw 'Chromium installation failed.' }
    }
    $testSpec = if ($AuditOnly) { 'tests/e2e/social-audit.spec.ts' } else { 'tests/e2e/social-walkthrough.spec.ts' }
    npm exec playwright test $testSpec -- --workers=1 --reporter=line
    if ($LASTEXITCODE -ne 0) { throw 'The complete product simulation failed.' }
  } finally { Pop-Location }

  if ($SmokeOnly -or $AuditOnly) {
    Write-Host $(if ($AuditOnly) { 'The responsive audit capture completed.' } else { 'The complete browser workflow passed in smoke mode.' })
    return
  }

  $sourceVideo = Get-ChildItem -Path (Join-Path $webDir 'test-results') -Filter '*.webm' -Recurse |
    Where-Object { $_.LastWriteTime -ge $recordingStartedAt } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if ($null -eq $sourceVideo) { throw 'Playwright completed without producing a new WebM video.' }

  $runId = [guid]::NewGuid().ToString('N')
  $workDir = Join-Path $env:TEMP "smcc-video-$runId"
  [IO.Directory]::CreateDirectory($workDir) | Out-Null
  $narration = Join-Path $workDir 'narration.wav'
  $output = Join-Path $demoDir 'demo.webm'
  New-Narration $narration

  $sourceProbe = (& $ffprobe -v error -show_entries 'format=duration' -of json $sourceVideo.FullName) | Out-String | ConvertFrom-Json
  $duration = [double]$sourceProbe.format.duration
  if ($duration -lt 180) { throw "Recorded simulation is too short: $duration seconds." }

  $audioFilter = "[1:a]apad=pad_dur=$duration[a]"
  & $ffmpeg -hide_banner -loglevel warning -y -i $sourceVideo.FullName -i $narration `
    -filter_complex $audioFilter -map 0:v:0 -map '[a]' `
    -c:v libvpx-vp9 -crf 38 -b:v 0 -deadline realtime -cpu-used 8 -row-mt 1 `
    -c:a libopus -b:a 64k -t $duration $output
  if ($LASTEXITCODE -ne 0) { throw 'Final demo encoding failed.' }

  & $ffmpeg -hide_banner -loglevel error -y -ss '00:03:32' -i $output -frames:v 1 (Join-Path $demoDir 'demo-thumbnail.png')
  $frameTimes = @(
    '00:00:10', '00:00:35', '00:01:00', '00:01:25', '00:01:50',
    '00:02:01', '00:02:40', '00:03:05', '00:03:30', '00:03:55'
  )
  for ($index = 0; $index -lt $frameTimes.Count; $index += 1) {
    & $ffmpeg -hide_banner -loglevel error -y -ss $frameTimes[$index] -i $output -frames:v 1 `
      (Join-Path $verificationDir ('{0:D2}-frame.png' -f ($index + 1)))
  }

  $probeJson = (& $ffprobe -v error -show_entries 'format=duration,size:stream=codec_type,codec_name,width,height' -of json $output) | Out-String
  $probe = $probeJson | ConvertFrom-Json
  $videoStream = $probe.streams | Where-Object { $_.codec_type -eq 'video' } | Select-Object -First 1
  $audioStream = $probe.streams | Where-Object { $_.codec_type -eq 'audio' } | Select-Object -First 1
  if ([double]$probe.format.duration -lt 180 -or $videoStream.width -ne 1280 -or $videoStream.height -ne 720 -or $null -eq $audioStream) {
    throw 'Demo acceptance failed.'
  }

  $hash = (Get-FileHash -Algorithm SHA256 $output).Hash.ToLower()
  $evidence = [ordered]@{
    generated_at_utc = [DateTime]::UtcNow.ToString('o')
    duration_seconds = [Math]::Round([double]$probe.format.duration, 3)
    width = $videoStream.width
    height = $videoStream.height
    video_codec = $videoStream.codec_name
    audio_codec = $audioStream.codec_name
    browser = 'Playwright Chromium 143 (bundled build 1200)'
    data_boundary = 'Deterministic synthetic workspace; provider calls disabled'
    workflow = 'Login -> account boundaries -> compose -> per-provider progress/results -> retry evidence -> analytics'
    captions = 'demo-captions.vtt'
    sha256 = $hash
    bytes = (Get-Item $output).Length
    verification_frames = $frameTimes.Count
    frame_timestamps = $frameTimes
  }
  [IO.File]::WriteAllText((Join-Path $verificationDir 'verification.json'), ($evidence | ConvertTo-Json) + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
  [IO.File]::WriteAllText((Join-Path $demoDir 'demo.sha256'), "$hash  demo.webm$([Environment]::NewLine)", [Text.UTF8Encoding]::new($false))
  $evidence | ConvertTo-Json
} finally {
  foreach ($process in $ownedProcesses) {
    if ($process -and -not $process.HasExited) { Stop-ProcessTree -ProcessId $process.Id }
  }
}
