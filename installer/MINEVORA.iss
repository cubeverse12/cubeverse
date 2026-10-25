; MINEVORA Windows 11 development installer.
; The launcher is installed per-user, without requesting administrator rights.
; The resulting Setup EXE is NOT a trusted release until signed and verified.
#define AppVersion "0.2.0-dev"

[Setup]
AppId={{6DF51B63-2068-44CC-9048-8E8EB2195647}
AppName=MINEVORA Launcher
AppVersion={#AppVersion}
AppPublisher=MINEVORA
AppPublisherURL=https://cubeverse12.github.io/cubeverse/
AppSupportURL=https://cubeverse12.github.io/cubeverse/
DefaultDirName={localappdata}\Programs\MINEVORA
DefaultGroupName=MINEVORA
UninstallDisplayIcon={app}\MINEVORA.exe
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
WizardStyle=modern
DisableProgramGroupPage=yes
OutputDir=..\dist\installer
OutputBaseFilename=MINEVORA_Setup_DEVELOPMENT
Compression=lzma2
SolidCompression=yes
SetupLogging=yes
CloseApplications=yes

[Languages]
Name: "polish"; MessagesFile: "compiler:Languages\Polish.isl"

[Tasks]
Name: "desktopicon"; Description: "Utwórz skrót MINEVORA na pulpicie"; GroupDescription: "Dodatkowe skróty:"; Flags: unchecked

[Files]
; Keep PyInstaller's _internal folder and bundled assets intact.
Source: "..\dist\MINEVORA\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\MINEVORA Launcher"; Filename: "{app}\MINEVORA.exe"
Name: "{autodesktop}\MINEVORA Launcher"; Filename: "{app}\MINEVORA.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\MINEVORA.exe"; Description: "Uruchom MINEVORA Launcher"; Flags: nowait postinstall skipifsilent

; User profiles and Minecraft installations are stored outside {app}.
; Uninstall intentionally does not erase the user's profile or game data.
