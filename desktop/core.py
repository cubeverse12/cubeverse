"""MINEVORA 19 — small instance store + verified GitHub PvP update helper."""
from __future__ import annotations
import json, os, re, shutil, hashlib, urllib.request, urllib.parse
from pathlib import Path
from datetime import datetime

APP_VERSION = '19.2.1-rc1'
HOME = Path(os.environ.get('APPDATA', str(Path.home()))) / 'MINEVORA'
DATA_FILE = HOME / 'rebuild19.json'
MC_DIR = Path(os.environ.get('APPDATA', str(Path.home()))) / '.minecraft'
PROJECT_REPO = 'cubeverse12/minevora-pvp-hud.'
LEGACY_ROOT = Path.home()/'.minevora'/'instances'
LEGACY_PROFILES = Path.home()/'.minevora'/'profiles.json'


def safe_name(value: str) -> str:
    value = str(value).strip()
    if not re.fullmatch(r'[\w .-]{1,50}',value) or value in ('.','..') or value.endswith(('.', ' ')):
        raise ValueError('Nieprawidłowa nazwa instancji')
    return value


def instance_id(name: str) -> str:
    # Independent profile storage, no user-supplied traversal.
    safe_name(name)
    import uuid
    return uuid.uuid4().hex[:16]


def initial_store():
    return {'selected':'', 'instances':[], 'ram':4, 'skin':''}


def legacy_instances():
    # Read-only import; old launcher files and worlds are never moved or overwritten.
    try:
        profiles=json.loads(LEGACY_PROFILES.read_text(encoding='utf-8'))
        if not isinstance(profiles,list):return []
    except (OSError,ValueError,TypeError):return []
    entries=[]
    for p in profiles[:100]:
        if not isinstance(p,dict):continue
        raw=str(p.get('version',''))
        versions=re.findall(r'[0-9]+\.[0-9]+(?:\.[0-9]+)?',raw)
        path=Path(str(p.get('game_dir',''))).expanduser().resolve()
        if not versions or not path.is_relative_to(LEGACY_ROOT.resolve()) or not path.is_dir():continue
        loader=next((l for l in ('neoforge','fabric','forge','quilt') if l in raw.lower()),'vanilla')
        gameid=raw if re.fullmatch(r'[A-Za-z0-9_.+-]{1,130}',raw) else ''
        if gameid and not (MC_DIR/'versions'/gameid/(gameid+'.json')).is_file():gameid=''
        ident=hashlib.sha256(('legacy-'+str(p.get('id',''))+str(path)).encode()).hexdigest()[:16]
        entries.append({'id':ident,'name':str(p.get('name','Minecraft'))[:50],'version':versions[-1],
                        'loader':loader,'game_id':gameid,'game_dir':str(path)})
    return entries



def read_store():
    try:
        obj=json.loads(DATA_FILE.read_text(encoding='utf-8'))
        if not isinstance(obj,dict) or not isinstance(obj.get('instances'),list):return initial_store()
        clean=[]
        for p in obj['instances'][:100]:
            if not isinstance(p,dict):continue
            ident=p.get('id','')
            ver=p.get('version','')
            loader=p.get('loader','')
            if not (re.fullmatch(r'[a-f0-9]{16}',str(ident)) and re.fullmatch(r'[0-9]+\.[0-9]+(?:\.[0-9]+)?',str(ver)) and loader in ('vanilla','fabric','forge','neoforge','quilt')):continue
            item={'id':ident,'name':str(p.get('name','Minecraft'))[:50],'version':ver,'loader':loader,'game_id':str(p.get('game_id',''))[:130]}
            old=p.get('game_dir')
            if isinstance(old,str) and old:
                folder=Path(old).expanduser().resolve()
                if folder.is_relative_to(LEGACY_ROOT.resolve()):item['game_dir']=str(folder)
            clean.append(item)
        selected=obj.get('selected','')
        if selected not in [p['id'] for p in clean]:selected=clean[0]['id'] if clean else ''
        result={'instances':clean,'selected':selected,'ram':max(2,min(32,int(obj.get('ram',4)))),'skin':str(obj.get('skin',''))[:600]}
        imported = obj.get('web_profile')
        if isinstance(imported,dict):
            nick = imported.get('nickname','')
            avatar = imported.get('avatarData','')
            mode = imported.get('mode','BedWars')
            if (isinstance(nick,str) and re.fullmatch(r'[A-Za-z0-9_-]{3,20}',nick)
                    and isinstance(avatar,str) and len(avatar) <= 400000
                    and (not avatar or re.fullmatch(r'data:image/webp;base64,[A-Za-z0-9+/=]+',avatar))):
                color = imported.get('color', 'purple')
                result['web_profile']={'nickname':nick,'avatarData':avatar,
                                      'color':color if color in ('purple','blue','teal','rose') else 'purple',
                                      'mode':mode if mode in ('BedWars','SkyWars','Crystal PvP','Parkour',
                                                             'TNT Run','Build Battle','Spleef','Duels') else 'BedWars'}
        return result
    except (OSError,ValueError,TypeError,OverflowError):
        result=initial_store()
        result['instances']=legacy_instances()
        if result['instances']:result['selected']=result['instances'][0]['id']
        return result


def save_store(data):
    HOME.mkdir(parents=True,exist_ok=True)
    temp=DATA_FILE.with_suffix('.tmp')
    temp.write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding='utf-8')
    temp.replace(DATA_FILE)


def game_path(instance):
    ident=instance.get('id','')
    if not re.fullmatch(r'[a-f0-9]{16}',str(ident)):raise ValueError('Błędny identyfikator instancji')
    old=instance.get('game_dir')
    if isinstance(old,str) and old:
        folder=Path(old).expanduser().resolve()
        if not folder.is_relative_to(LEGACY_ROOT.resolve()):raise ValueError('Nieprawidłowa ścieżka starej instancji')
        return folder
    return HOME/'instances'/ident


def selected_instance(data):
    return next((p for p in data['instances'] if p['id']==data['selected']),None)


def github_json(path):
    if not path.startswith('/') or '://' in path or '\\' in path:raise ValueError('Błędne API GitHub')
    req=urllib.request.Request('https://api.github.com/repos/'+PROJECT_REPO+path,headers={'User-Agent':'MINEVORA-19-Windows','Accept':'application/vnd.github+json'})
    with urllib.request.urlopen(req,timeout=30) as resp:return json.load(resp)


def compatible_pvp_release(instance):
    if not instance or instance.get('loader')!='fabric' or instance.get('version')!='1.21.1':
        raise ValueError('PvP HUD obecnie obsługuje wyłącznie Fabric 1.21.1.')
    release=github_json('/releases/latest')
    assets=release.get('assets',[])
    jars=[a for a in assets if a.get('name','').endswith('-FABRIC-1.21.1.jar')]
    if len(jars)!=1:raise ValueError('Nie ma kompatybilnego pliku .jar w najnowszym wydaniu GitHub.')
    jar=jars[0]
    sums=[a for a in assets if a.get('name')==jar.get('name')+'.sha256']
    if len(sums)!=1:raise ValueError('Brakuje sumy kontrolnej SHA-256.')
    return jar,sums[0]


def download_bytes(url,max_bytes):
    parts=urllib.parse.urlsplit(url)
    if parts.scheme!='https' or parts.hostname not in ('github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'):
        raise ValueError('Nieznany adres pobierania')
    req=urllib.request.Request(url,headers={'User-Agent':'MINEVORA-19-Windows'})
    with urllib.request.urlopen(req,timeout=75) as resp:
        parts=urllib.parse.urlsplit(resp.geturl())
        if parts.scheme!='https' or parts.hostname not in ('github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'):
            raise ValueError('Przekierowanie poza GitHub.')
        data=resp.read(max_bytes+1)
    if len(data)>max_bytes:raise ValueError('Plik jest zbyt duży')
    return data


def install_pvp(instance):
    jar, checksum=compatible_pvp_release(instance)
    name=jar.get('name','')
    if not re.fullmatch(r'MINEVORA-PVP-HUD-[0-9.]+-FABRIC-1\.21\.1\.jar',name):raise ValueError('Niedozwolona nazwa moda')
    expected_text=download_bytes(checksum['browser_download_url'],1024).decode('ascii').strip().split()[0]
    if not re.fullmatch('[a-f0-9]{64}',expected_text):raise ValueError('Niepoprawna suma kontrolna wydania')
    payload=download_bytes(jar['browser_download_url'],80*1024*1024)
    if hashlib.sha256(payload).hexdigest()!=expected_text:raise ValueError('Sumy SHA-256 moda się nie zgadzają')
    import zipfile,io
    with zipfile.ZipFile(io.BytesIO(payload)) as z:
        if 'fabric.mod.json' not in z.namelist():raise ValueError('Nie jest to mod Fabric')
    dest=game_path(instance)/'mods';dest.mkdir(parents=True,exist_ok=True)
    # Do not leave multiple generations enabled in the same instance.
    old=sorted(dest.glob('MINEVORA-PVP-HUD-*-FABRIC-1.21.1.jar'))
    backups=HOME/'backups'/'pvp'/datetime.now().strftime('%Y%m%d-%H%M%S')
    if old:
        backups.mkdir(parents=True,exist_ok=True)
        for file in old:shutil.copy2(file,backups/file.name)
    tmp=dest/(name+'.download')
    try:
        tmp.write_bytes(payload)
        for file in old:
            if file.name!=name:file.rename(file.with_suffix('.jar.disabled'))
        tmp.replace(dest/name)
    finally:tmp.unlink(missing_ok=True)
    return str(dest/name)


def profile_installed(profile, versions_root=None):
    """An old saved game_id is not proof that the installed version exists."""
    if not isinstance(profile, dict):
        return False
    value = profile.get('game_id')
    if not isinstance(value, str) or not re.fullmatch(r'[A-Za-z0-9_.+-]{1,140}', value) or value in ('.', '..'):
        return False
    versions = Path(versions_root) if versions_root is not None else MC_DIR / 'versions'
    return (versions / value / (value+'.json')).is_file()


def ensure_profile_game_id(profile):
    if not profile_installed(profile):
        raise ValueError('Brak plików instalacji wybranej wersji Minecraft. Otwórz Instancje i kliknij Zainstaluj Minecraft.')
    return profile['game_id']
