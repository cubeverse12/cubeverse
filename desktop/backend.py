"""Installation helpers for MINEVORA Java profiles and verified Fabric dependencies."""
from __future__ import annotations
import hashlib, json, re, shutil, urllib.request, urllib.parse
from pathlib import Path
from core import MC_DIR, HOME, game_path, install_pvp

FABRIC_API_ID = 'P7dR8mSH'


def official_releases():
    import minecraft_launcher_lib as m
    data = m.utils.get_version_list()
    return [d['id'] for d in data if d.get('type') == 'release' and re.fullmatch(r'\d+\.\d+(?:\.\d+)?', str(d.get('id', '')))]


def install_profile(profile, progress=lambda x: None, with_pvp=True):
    import minecraft_launcher_lib as m
    version, loader = profile['version'], profile['loader']
    MC_DIR.mkdir(parents=True, exist_ok=True)
    progress('Instalowanie Minecraft ' + version + '…')
    if loader == 'vanilla':
        m.install.install_minecraft_version(version, str(MC_DIR))
        gameid=version
    else:
        obj=m.mod_loader.get_mod_loader(loader)
        if not obj.is_minecraft_version_supported(version):
            raise ValueError(f'{loader.title()} nie obsługuje Minecraft {version}.')
        gameid=obj.install(version, str(MC_DIR))
    if not isinstance(gameid,str) or not re.fullmatch(r'[\w.+-]{1,140}',gameid) or gameid in ('.','..'):
        raise RuntimeError('Instalator zwrócił nieprawidłowy identyfikator wersji')
    if not (MC_DIR/'versions'/gameid/(gameid+'.json')).is_file():
        raise RuntimeError('Minecraft nie utworzył wymaganego pliku wersji')
    game_path(profile).mkdir(parents=True, exist_ok=True)
    warnings=[]
    if with_pvp and version=='1.21.1' and loader=='fabric':
        progress('Pobieranie Fabric API i MINEVORA PvP HUD…')
        try: install_fabric_api(profile)
        except Exception as e:warnings.append('Fabric API: '+str(e))
        try: install_pvp(profile)
        except Exception as e:warnings.append('PvP HUD: '+str(e))
    return {'id':gameid,'warnings':warnings}


def install_fabric_api(profile):
    if profile.get('loader') != 'fabric' or profile.get('version') != '1.21.1':
        raise ValueError('Fabric API dla tego profilu nie jest obsługiwane')
    params=urllib.parse.urlencode({'loaders':'["fabric"]','game_versions':'["1.21.1"]'})
    url='https://api.modrinth.com/v2/project/'+FABRIC_API_ID+'/version?'+params
    req=urllib.request.Request(url, headers={'User-Agent':'MINEVORA/20 (launcher)'})
    with urllib.request.urlopen(req, timeout=25) as resp:
        versions=json.load(resp)
    if not isinstance(versions,list) or not versions:raise RuntimeError('Brak zgodnego Fabric API w Modrinth')
    version=next((v for v in versions if v.get('version_type')=='release'),versions[0])
    files=version.get('files') or []
    file=next((f for f in files if f.get('primary')), files[0] if files else {})
    name=file.get('filename',''); checksum=file.get('hashes',{}).get('sha512','')
    if not re.fullmatch(r'fabric-api[^/\\]*\.jar',name) or not re.fullmatch(r'[a-f0-9]{128}',checksum):
        raise RuntimeError('Nieprawidłowy plik lub suma kontrolna Fabric API')
    download_url=file.get('url','')
    if urllib.parse.urlsplit(download_url).hostname!='cdn.modrinth.com' or not download_url.startswith('https://'):
        raise RuntimeError('Niedozwolone źródło Fabric API')
    target=game_path(profile)/'mods';target.mkdir(parents=True,exist_ok=True)
    dest=target/name
    if dest.is_file() and hashlib.sha512(dest.read_bytes()).hexdigest()==checksum:return str(dest)
    req=urllib.request.Request(download_url,headers={'User-Agent':'MINEVORA/20'})
    with urllib.request.urlopen(req,timeout=75) as resp:
        if not resp.geturl().startswith('https://cdn.modrinth.com/'):
            raise RuntimeError('Nieoczekiwane przekierowanie przy pobieraniu Fabric API')
        payload=resp.read(45*1024*1024+1)
    if len(payload)>45*1024*1024 or hashlib.sha512(payload).hexdigest()!=checksum:
        raise RuntimeError('Pobrane Fabric API nie przeszło kontroli integralności')
    tmp=dest.with_suffix('.jar.download')
    try:
        tmp.write_bytes(payload)
        # Disable older active Fabric API variants, without deleting.
        for old in target.glob('fabric-api*.jar'):
            if old.name != name:old.rename(old.with_suffix('.jar.disabled'))
        tmp.replace(dest)
    finally:tmp.unlink(missing_ok=True)
    return str(dest)


def free_disk_gb(path=None):
    target=path or HOME
    target=Path(target)
    target.mkdir(parents=True,exist_ok=True)
    return shutil.disk_usage(target).free / (1024**3)
