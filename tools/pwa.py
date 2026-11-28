#!/usr/bin/env python3
"""Turns the hosted game into an installable web app (iPhone: Safari > Share > Add to Home Screen;
Android Chrome: Install app). Run on www before make-manifest.py, then pwa.py --sw after it.
   python3 tools/pwa.py www ICON.png        icons, manifest, head tags
   python3 tools/pwa.py www --sw            sw.js for the build in www/version.json"""
import json, os, sys
root = sys.argv[1]
if sys.argv[2] == '--sw':
    build = json.load(open(os.path.join(root, 'version.json')))['build']
    sw = open(os.path.join(os.path.dirname(__file__), 'sw-template.js')).read().replace('__BUILD__', str(build))
    open(os.path.join(root, 'sw.js'), 'w').write(sw); print('sw.js for build', build); sys.exit()
from PIL import Image
icon = Image.open(sys.argv[2]).convert('RGBA')
os.makedirs(os.path.join(root, 'icons'), exist_ok=True)
for n, s in [('icon-192.png', 192), ('icon-512.png', 512), ('apple-touch-icon.png', 180)]:
    im = icon.resize((s, s), Image.LANCZOS)
    if n.startswith('apple'): bg = Image.new('RGBA', im.size, (11, 12, 14, 255)); bg.alpha_composite(im); im = bg.convert('RGB')   # iPhone icons can't be see-through
    im.save(os.path.join(root, 'icons', n), optimize=True)
json.dump({
    'name': 'Rebirth', 'short_name': 'Rebirth', 'id': './', 'start_url': './', 'scope': './',
    'display': 'fullscreen', 'display_override': ['fullscreen', 'standalone'], 'orientation': 'landscape',
    'background_color': '#0b0c0e', 'theme_color': '#0b0c0e',
    'description': 'Zombie survival in a ruined Denver.',
    'icons': [{'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'}]
}, open(os.path.join(root, 'manifest.json'), 'w'), indent=1)
p = os.path.join(root, 'index.html'); s = open(p).read()
tags = ('<link rel="manifest" href="manifest.json">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="Rebirth">\n'
        '<meta name="theme-color" content="#0b0c0e">\n')
assert 'rel="manifest"' not in s
open(p, 'w').write(s.replace('<head>\n', '<head>\n' + tags, 1)); print('web app: icons, manifest, head tags')
