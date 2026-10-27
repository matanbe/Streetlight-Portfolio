# Images → resized (≤1800px wide) and uploaded to S3 under v/<project>/img/<name>; lottie .json → public/lottie/<project>/.
# Writes videos/media.json (local file → URL). Usage: python3 scripts/media.py project [project…]
import os, re, sys, json, shutil, subprocess, boto3
ROOT = 'webflow-export/projects'; CDN = 'https://d375a3v81h8eln.cloudfront.net/'
env = dict(l.strip().split('=', 1) for l in open('.env.local') if l.startswith('AWS_'))
s3 = boto3.client('s3', region_name='eu-north-1', aws_access_key_id=env['AWS_ACCESS_KEY_ID'], aws_secret_access_key=env['AWS_SECRET_ACCESS_KEY'])
clean = lambda f: re.sub(r'-+', '-', re.sub(r'^\d+-', '', f).lower().replace('_', '-')).strip('-')
man = json.load(open('videos/media.json')) if os.path.exists('videos/media.json') else {}
CT = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif'}
for p in sys.argv[1:]:
    for f in sorted(os.listdir(f'{ROOT}/{p}')):
        src, ext = f'{ROOT}/{p}/{f}', os.path.splitext(f)[1].lower()
        if f'{p}/{f}' in man: continue
        if ext == '.json':
            os.makedirs(f'public/lottie/{p}', exist_ok=True); shutil.copy(src, f'public/lottie/{p}/{clean(f)}'); man[f'{p}/{f}'] = f'/lottie/{p}/{clean(f)}'
        elif ext in CT:
            os.makedirs(f'videos/out/{p}/img', exist_ok=True); dst = f'videos/out/{p}/img/{clean(f)}'
            if ext in ('.jpg', '.jpeg'): subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', "scale='min(1800,iw)':-2", '-q:v', '3', dst], check=True)
            elif ext == '.png': subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', "scale='min(1800,iw)':-2", dst], check=True)
            else: shutil.copy(src, dst)
            key = f'v/{p}/img/{clean(f)}'
            s3.upload_file(dst, 'streetlight', key, ExtraArgs={'ContentType': CT[ext], 'CacheControl': 'public, max-age=31536000'})
            man[f'{p}/{f}'] = CDN + key
        else: continue
        json.dump(man, open('videos/media.json', 'w'), indent=1)
    print(p, 'ok')
for k, v in json.load(open('videos/done.json')).items(): man[v['src']] = CDN + k   # the compressed videos too
json.dump(man, open('videos/media.json', 'w'), indent=1); print(len(man), 'files in videos/media.json')
