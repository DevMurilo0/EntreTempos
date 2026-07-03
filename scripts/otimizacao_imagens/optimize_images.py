import os
from PIL import Image
import json

MAX_SIZE = 100 * 1024 # 100KB

changes = {}

for root, dirs, files in os.walk("."):
    for file in files:
        if file.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            path = os.path.join(root, file)
            size = os.path.getsize(path)
            
            if size > MAX_SIZE:
                print(f"Optimizing {path} ({size/1024:.1f}KB)")
                try:
                    img = Image.open(path)
                    
                    # Convert to RGB if no transparency, or keep RGBA
                    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                        # Keep alpha channel for webp
                        img = img.convert("RGBA")
                    else:
                        img = img.convert("RGB")
                    
                    # Calculate new size if image is too large in dimensions
                    max_dim = 1920
                    if img.width > max_dim or img.height > max_dim:
                        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                        
                    # Target path
                    base_name = os.path.splitext(file)[0]
                    target_file = base_name + ".webp"
                    target_path = os.path.join(root, target_file)
                    
                    img.save(target_path, "webp", quality=80, method=4)
                    
                    # Remove original if we converted format
                    if target_path != path:
                        os.remove(path)
                        # We track filename changes to update HTML
                        changes[file] = target_file
                    
                except Exception as e:
                    print(f"Error optimizing {path}: {e}")

with open("image_changes.json", "w") as f:
    json.dump(changes, f)

print(f"Optimization complete. {len(changes)} files converted format.")
