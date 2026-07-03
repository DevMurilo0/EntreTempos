import os
import json
import re

# Load changes
try:
    with open("image_changes.json", "r") as f:
        changes = json.load(f)
except Exception:
    changes = {}

for root, dirs, files in os.walk("."):
    for file in files:
        if file.endswith(".html"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Replace filenames
            for old_name, new_name in changes.items():
                # Avoid accidentally matching parts of other names, but it's okay for now
                # We'll do a simple string replace for occurrences of the old filename
                # In most URLs it's just 'img/filename.png'
                content = content.replace(old_name, new_name)
            
            # Add loading="lazy" decoding="async" to <img> tags
            # We find all <img> tags and add these attributes if they aren't present
            def update_img_tag(match):
                tag = match.group(0)
                # Don't add if already there
                if 'loading=' not in tag:
                    tag = tag.replace('<img', '<img loading="lazy" decoding="async"')
                return tag
            
            content = re.sub(r'<img\b[^>]*>', update_img_tag, content)
            
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)

print("HTML update complete.")
