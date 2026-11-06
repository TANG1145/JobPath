$ErrorActionPreference='Stop'
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class JobPathExplorer {
 [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int command);
 [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h,IntPtr after,int x,int y,int w,int height,uint flags);
}
'@
$shell=New-Object -ComObject Shell.Application
function Show-EvidenceFile([string]$file) {
 $folder=[System.IO.Path]::GetDirectoryName($file)
 $leaf=[System.IO.Path]::GetFileName($file)
 $opened=$false
 for($attempt=0;$attempt -lt 160;$attempt++) {
  foreach($window in @($shell.Windows())) {
   try {
    if($window.Document.Folder.Self.Path -ne $folder){continue}
    $item=$window.Document.Folder.ParseName($leaf)
    if($null -eq $item){continue}
    $window.Document.SelectItem($item,29)
    $handle=[IntPtr]$window.HWND
    if([JobPathExplorer]::IsIconic($handle)){[void][JobPathExplorer]::ShowWindow($handle,9)}
    if(-not [JobPathExplorer]::SetWindowPos($handle,[IntPtr](-1),0,0,0,0,67)){throw 'Window activation failed'}
    try {[void][JobPathExplorer]::SetForegroundWindow($handle)}
    finally {[void][JobPathExplorer]::SetWindowPos($handle,[IntPtr](-2),0,0,0,0,67)}
    return
   } catch {continue}
  }
  if(-not $opened){Start-Process explorer.exe -ArgumentList ('/select,"'+$file+'"');$opened=$true}
  Start-Sleep -Milliseconds 30
 }
 throw 'Window not found'
}
[Console]::Out.WriteLine('READY')
while($null -ne ($line=[Console]::ReadLine())) {
 try {
  $file=[Text.Encoding]::Unicode.GetString([Convert]::FromBase64String($line))
  Show-EvidenceFile $file
  [Console]::Out.WriteLine('OK')
 } catch {[Console]::Out.WriteLine('ERROR')}
}
