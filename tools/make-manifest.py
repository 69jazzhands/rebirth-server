#!/usr/bin/env python3
"""Writes www/version.json: the game version plus every file's size and SHA-256.
The phone and PC apps read it to download only the files that changed.
   python3 tools/make-manifest.py www 0.8.0"""
import hashlib, json, os, sys, time
root = sys.argv[1] if len(sys.argv) > 1 else 'www'
version = sys.argv[2] if len(sys.argv) > 2 else '0.0.0'
files = {}
for d, _, names in os.walk(root):
    for n in sorted(names):
        p = os.path.join(d, n); rel = os.path.relpath(p, root).replace(os.sep, '/')
        if rel == 'version.json': continue
        data = open(p, 'rb').read()
        files[rel] = [len(data), hashlib.sha256(data).hexdigest()]
build = int(time.strftime('%Y%m%d%H%M', time.gmtime()))
json.dump({'version': version, 'build': build, 'files': dict(sorted(files.items()))}, open(os.path.join(root, 'version.json'), 'w'), indent=0)
print('version.json: %s build %d, %d files, %.1f MB' % (version, build, len(files), sum(v[0] for v in files.values()) / 1e6))
