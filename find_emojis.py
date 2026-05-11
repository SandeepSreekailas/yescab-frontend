import os
import re

frontend_dir = r'c:\Users\HP\Desktop\YesCab(anti-ver)\frontend\src'
emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]', flags=re.UNICODE)

for root, _, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                matches = set(emoji_pattern.findall(content))
                if matches:
                    print(file + ':', " ".join(matches))
