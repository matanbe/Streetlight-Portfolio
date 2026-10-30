# Compress project videos for the web (H.264, ≤1600px wide, no audio, faststart) + a poster frame, then upload to S3 (v/<project>/<name>.mp4).
# Drop new videos in videos/<project>/ (any .mp4/.mov) — they're picked up too.
# Usage: python3 scripts/videos.py [max-files]   — skips anything already done (videos/out/…); safe to re-run.
import os, re, sys, subprocess, boto3, json, time
ROOT = 'webflow-export/projects'; OUT = 'videos/out'; SKIP = ('n1-agency', 'museum-decade-report')
env = dict(l.strip().split('=', 1) for l in open('.env.local') if l.startswith('AWS_'))
s3 = boto3.client('s3', region_name='eu-north-1', aws_access_key_id=env['AWS_ACCESS_KEY_ID'], aws_secret_access_key=env['AWS_SECRET_ACCESS_KEY'])
clean = lambda f: re.sub(r'-+', '-', re.sub(r'^\d+-', '', f.rsplit('.', 1)[0]).lower().replace('_', '-')).strip('-')
log = json.load(open('videos/done.json')) if os.path.exists('videos/done.json') else {}
n, t0 = 0, time.time(); limit = int(sys.argv[1]) if len(sys.argv) > 1 else 99
dirs = [(ROOT, p) for p in sorted(os.listdir(ROOT))] + [('videos', p) for p in sorted(os.listdir('videos')) if p != 'out']
for R, p in dirs:
    if p.startswith(('_', 'site-', '.')) or p in SKIP or p == 'archive' or not os.path.isdir(f'{R}/{p}'): continue
    for f in sorted(os.listdir(f'{R}/{p}')):
        if not f.lower().endswith(('.mp4', '.mov')): continue
        key = f'v/{p}/{clean(f)}.mp4'
        if key in log: continue
        if n >= limit or time.time() - t0 > 140: print('…more left'); sys.exit()
        os.makedirs(f'{OUT}/{p}', exist_ok=True); dst = f'{OUT}/{p}/{clean(f)}.mp4'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{R}/{p}/{f}', '-vf', "scale='min(1600,iw)':-2", '-c:v', 'libx264', '-preset', 'fast', '-crf', '27',
                        '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', dst], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1', '-i', dst, '-frames:v', '1', '-q:v', '3', dst[:-4] + '.jpg'], check=True)
        s3.upload_file(dst, 'streetlight', key, ExtraArgs={'ContentType': 'video/mp4', 'CacheControl': 'public, max-age=31536000'})
        s3.upload_file(dst[:-4] + '.jpg', 'streetlight', key[:-4] + '.jpg', ExtraArgs={'ContentType': 'image/jpeg', 'CacheControl': 'public, max-age=31536000'})
        a, b = os.path.getsize(f'{R}/{p}/{f}') // 1024, os.path.getsize(dst) // 1024
        log[key] = {'src': f'{p}/{f}', 'kb_before': a, 'kb_after': b}; json.dump(log, open('videos/done.json', 'w'), indent=1); n += 1
        print(f'{key}  {a}K → {b}K', flush=True)
print('ALL DONE')
