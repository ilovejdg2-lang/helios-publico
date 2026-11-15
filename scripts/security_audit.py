import argparse
import base64
import json
import os
from pathlib import Path
import re
import subprocess

# Output contains locations and categories only, never matched values.
PATTERNS = [
    ('private_key', re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')),
    ('provider_token', re.compile(r'\b(?:sk-(?:proj-|ant-)?[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{30,}|sb_secret_[A-Za-z0-9_-]{20,})\b')),
    ('aws_access_key', re.compile(r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b')),
    ('literal_credential', re.compile(r'''(?im)^[ \t]*(?:export[ \t]+|const[ \t]+)?(?:AI_API_KEY|NASA_API_KEY|SUPABASE_DB_PASSWORD|SUPABASE_SERVICE_ROLE_KEY|DATABASE_PASSWORD)[ \t]*=[ \t]*["']?([A-Za-z0-9_./+!@#$%^&*=-]{8,})''')),
]
PLACEHOLDERS = re.compile(r'^(?:DEMO_KEY|YOUR_|your_|example|placeholder|changeme|process\.|env\.|undefined|sb_publishable_)', re.I)

def findings(content):
    result = set()
    for category, pattern in PATTERNS:
        for match in pattern.finditer(content):
            value = match.group(1) if category == 'literal_credential' else match.group(0)
            if not PLACEHOLDERS.search(value):
                result.add(category)
    # Publishable/anon Supabase credentials are public by design. service_role JWTs are not.
    for token in re.findall(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', content):
        try:
            part=token.split('.')[1]
            if json.loads(base64.urlsafe_b64decode(part+'='*(-len(part)%4))).get('role')=='service_role':
                result.add('supabase_service_role')
        except (ValueError, UnicodeError):
            pass
    return sorted(result)

def audit(repo):
    base=['git','-c','safe.directory='+repo.as_posix(),'-C',str(repo)]
    def git(*args):return subprocess.check_output(base+list(args))
    problems=[]
    tracked=git('ls-files','-z').decode().split('\0')
    for name in filter(None,tracked):
        p=Path(name)
        if p.name.startswith('.env') and p.name != '.env.example' or name.startswith('data/sessions/'):
            problems.append({'scope':'tracked','path':name,'category':'private_file_tracked'})
    local=git('ls-files','--cached','--others','--exclude-standard','-z').decode().split('\0')
    source_files=0
    for name in filter(None,local):
        file=repo/name
        if file.is_file() and (file.suffix.lower() in {'.ts','.tsx','.js','.py','.json','.md','.yml','.yaml','.txt','.sql','.pem'} or file.name.startswith('.env')):
            source_files+=1
            for category in findings(file.read_text(encoding='utf-8',errors='replace')):
                problems.append({'scope':'worktree','path':name,'category':category})
    objects={}
    for line in git('rev-list','--objects','--all').decode().splitlines():
        sha,_,name=line.partition(' ')
        if name and (Path(name).suffix.lower() in {'.ts','.tsx','.js','.json','.md','.yml','.yaml','.txt','.sql','.pem'} or Path(name).name.startswith('.env')):
            objects.setdefault(sha,name)
    batch=subprocess.Popen(base+['cat-file','--batch'],stdin=subprocess.PIPE,stdout=subprocess.PIPE)
    for sha,name in objects.items():
        batch.stdin.write((sha+'\n').encode());batch.stdin.flush()
        header=batch.stdout.readline().decode().split()
        if len(header)<3:continue
        data=batch.stdout.read(int(header[2]));batch.stdout.read(1)
        if header[1]!='blob':continue
        for category in findings(data.decode('utf-8',errors='replace')):
            problems.append({'scope':'history','blob':sha[:12],'path':name,'category':category})
    batch.stdin.close();batch.wait()
    assets=0
    for file in (repo/'dist').rglob('*'):
        if file.is_file() and file.suffix in {'.js','.html','.css','.json'}:
            assets+=1
            for category in findings(file.read_text(encoding='utf-8',errors='replace')):
                problems.append({'scope':'build','path':file.relative_to(repo).as_posix(),'category':category})
    # Detect accidental exposure of configured backend values, without outputting them.
    secrets=[]
    for envfile in repo.glob('.env*'):
        if envfile.name=='.env.example':continue
        for line in envfile.read_text(encoding='utf-8',errors='replace').splitlines():
            m=re.match(r'\s*(AI_API_KEY|NASA_API_KEY|SUPABASE_DB_PASSWORD|SUPABASE_SERVICE_ROLE_KEY)\s*=\s*(.*)',line)
            if m:
                value=m[2].strip().strip('\"\'')
                if len(value)>=8 and not PLACEHOLDERS.search(value):secrets.append(value)
    return {'repository':repo.name,'sourceFilesScanned':source_files,'historyObjectsScanned':len(objects),'buildAssetsScanned':assets,'configuredPrivateValues':len(secrets),'findings':problems},secrets

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',default='artifacts/security-audit.json');args=parser.parse_args()
    root=Path(__file__).resolve().parent.parent
    repositories=[root,root.parent/'NASA_SPACE_APP-BACKEND']
    reports=[];secrets=[]
    for repo in repositories:
        try:
            if (repo/'.git').exists():
                report,values=audit(repo);reports.append(report);secrets.extend(values)
        except (PermissionError, OSError):
            continue
    for file in (root/'dist').rglob('*'):
        if file.is_file() and file.suffix in {'.js','.html','.css','.json'}:
            content=file.read_text(encoding='utf-8',errors='replace')
            if any(value in content for value in secrets):reports[0]['findings'].append({'scope':'build','path':file.relative_to(root).as_posix(),'category':'configured_private_value'})
    output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps({'repositories':reports,'limitation':'Heuristic scan of locally available Git refs and text artifacts; not a guarantee that all secrets were found.'},indent=2),encoding='utf-8')
    print(json.dumps(reports,indent=2))
    raise SystemExit(1 if any(report['findings'] for report in reports) else 0)
