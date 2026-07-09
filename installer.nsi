; VideoNest Installer Script
; Requires NSIS (https://nsis.sourceforge.io/)

!include "MUI2.nsh"

; General
Name "VideoNest"
OutFile "VideoNest-Setup.exe"
InstallDir "$LOCALAPPDATA\VideoNest"
RequestExecutionLevel user

; Interface
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Languages
!insertmacro MUI_LANGUAGE "English"

; Installer Sections
Section "VideoNest" SecMain
  SetOutPath "$INSTDIR"
  
  ; Create directories
  CreateDirectory "$INSTDIR\backend"
  CreateDirectory "$INSTDIR\frontend"
  CreateDirectory "$INSTDIR\data"
  
  ; Copy files
  File /r "backend\dist\VideoNest\*.*"
  File /r "frontend\dist\*.*"
  
  ; Create launcher
  FileOpen $0 "$INSTDIR\VideoNest.bat" w
  FileWrite $0 '@echo off\r\n'
  FileWrite $0 'title VideoNest\r\n'
  FileWrite $0 'cd /d "$INSTDIR"\r\n'
  FileWrite $0 'start "VideoNest Backend" cmd /c "cd backend && VideoNest.exe"\r\n'
  FileWrite $0 'timeout /t 2 /nobreak >nul\r\n'
  FileWrite $0 'start http://localhost:5173\r\n'
  FileWrite $0 'pause\r\n'
  FileClose $0
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Create Start Menu shortcuts
  CreateDirectory "$SMPROGRAMS\VideoNest"
  CreateShortCut "$SMPROGRAMS\VideoNest\VideoNest.lnk" "$INSTDIR\VideoNest.bat"
  CreateShortCut "$SMPROGRAMS\VideoNest\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  
  ; Add to Programs and Features
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VideoNest" \
    "DisplayName" "VideoNest"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VideoNest" \
    "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VideoNest" \
    "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VideoNest" \
    "DisplayIcon" "$INSTDIR\VideoNest.bat"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VideoNest" \
    "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VideoNest" \
    "NoRepair" 1
SectionEnd

; Uninstaller Section
Section "Uninstall"
  ; Remove files
  RMDir /r "$INSTDIR"
  
  ; Remove Start Menu shortcuts
  RMDir /r "$SMPROGRAMS\VideoNest"
  
  ; Remove registry keys
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VideoNest"
SectionEnd
