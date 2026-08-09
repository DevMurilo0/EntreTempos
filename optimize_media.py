import os
import sys
import subprocess
import glob
from PIL import Image

WORKSPACE = os.path.dirname(os.path.abspath(__file__))
IGNORE_DIRS = {'.git', '.gemini', 'node_modules'}

def is_ignored(path):
    parts = path.split(os.sep)
    return any(ignored in parts for ignored in IGNORE_DIRS)

def optimize_image(filepath):
    try:
        orig_size = os.path.getsize(filepath)
        ext = os.path.splitext(filepath)[1].lower()
        tmp_path = filepath + ".tmp" + ext

        with Image.open(filepath) as img:
            # Check dimensions
            w, h = img.size
            max_dim = 1920
            if w > max_dim or h > max_dim:
                if w > h:
                    new_w = max_dim
                    new_h = int(h * (max_dim / w))
                else:
                    new_h = max_dim
                    new_w = int(w * (max_dim / h))
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            # Save options based on format
            if ext == '.webp':
                img.save(tmp_path, format='WEBP', quality=82, method=6, optimize=True)
            elif ext in ('.jpg', '.jpeg'):
                img.convert('RGB').save(tmp_path, format='JPEG', quality=82, optimize=True)
            elif ext == '.png':
                img.save(tmp_path, format='PNG', optimize=True)
            else:
                return False, 0, 0

        new_size = os.path.getsize(tmp_path)
        if new_size < orig_size:
            os.replace(tmp_path, filepath)
            return True, orig_size, new_size
        else:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            return False, orig_size, orig_size
    except Exception as e:
        print(f"Error optimizing image {filepath}: {e}")
        tmp_path = filepath + ".tmp" + os.path.splitext(filepath)[1].lower()
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        return False, 0, 0

def optimize_video(filepath):
    try:
        orig_size = os.path.getsize(filepath)
        ext = os.path.splitext(filepath)[1].lower()
        tmp_path = filepath + ".tmp" + ext

        if ext == '.mp4':
            cmd = [
                'ffmpeg', '-y', '-i', filepath,
                '-c:v', 'libx264', '-crf', '28', '-preset', 'medium',
                '-vf', "scale='min(1920,iw)':-2",
                '-c:a', 'aac', '-b:a', '128k',
                tmp_path
            ]
        elif ext == '.webm':
            cmd = [
                'ffmpeg', '-y', '-i', filepath,
                '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-row-mt', '1',
                '-vf', "scale='min(1920,iw)':-2",
                '-c:a', 'libopus', '-b:a', '96k',
                tmp_path
            ]
        else:
            return False, 0, 0

        result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        if result.returncode == 0 and os.path.exists(tmp_path):
            new_size = os.path.getsize(tmp_path)
            if new_size < orig_size:
                os.replace(tmp_path, filepath)
                return True, orig_size, new_size
            else:
                os.remove(tmp_path)
                return False, orig_size, orig_size
        else:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            print(f"FFmpeg failed for {filepath}: {result.stderr.decode('utf-8', errors='ignore')[-200:]}")
            return False, orig_size, orig_size
    except Exception as e:
        print(f"Error optimizing video {filepath}: {e}")
        return False, 0, 0

def main():
    print("Iniciando varredura e otimização de mídias...")
    image_exts = {'.jpg', '.jpeg', '.png', '.webp'}
    video_exts = {'.mp4', '.webm'}

    image_files = []
    video_files = []

    for root, dirs, files in os.walk(WORKSPACE):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            full_path = os.path.join(root, f)
            if ext in image_exts:
                image_files.append(full_path)
            elif ext in video_exts:
                video_files.append(full_path)

    print(f"Encontrados {len(image_files)} imagens e {len(video_files)} vídeos.")

    total_orig_img = 0
    total_new_img = 0
    img_count = 0

    print("\n--- Otimizando Imagens ---")
    for idx, path in enumerate(image_files, 1):
        rel_path = os.path.relpath(path, WORKSPACE)
        updated, orig, new = optimize_image(path)
        if updated:
            total_orig_img += orig
            total_new_img += new
            img_count += 1
            print(f"[{idx}/{len(image_files)}] Otimizada: {rel_path} ({orig/1024:.1f}KB -> {new/1024:.1f}KB, -{(1 - new/orig)*100:.1f}%)")
        else:
            total_orig_img += orig
            total_new_img += orig

    total_orig_vid = 0
    total_new_vid = 0
    vid_count = 0

    print("\n--- Otimizando Vídeos ---")
    for idx, path in enumerate(video_files, 1):
        rel_path = os.path.relpath(path, WORKSPACE)
        print(f"[{idx}/{len(video_files)}] Processando vídeo: {rel_path} ({os.path.getsize(path)/1024/1024:.2f}MB)...", end="", flush=True)
        updated, orig, new = optimize_video(path)
        if updated:
            total_orig_vid += orig
            total_new_vid += new
            vid_count += 1
            print(f" Concluído! ({orig/1024/1024:.2f}MB -> {new/1024/1024:.2f}MB, -{(1 - new/orig)*100:.1f}%)")
        else:
            total_orig_vid += orig
            total_new_vid += orig
            print(" Mantido arquivo original (sem redução adicional).")

    print("\n================ RESUMO DA OTIMIZAÇÃO ================")
    print(f"Imagens otimizadas: {img_count}/{len(image_files)}")
    print(f"Tamanho imagens: {total_orig_img/1024/1024:.2f} MB -> {total_new_img/1024/1024:.2f} MB")
    print(f"Vídeos otimizados: {vid_count}/{len(video_files)}")
    print(f"Tamanho vídeos: {total_orig_vid/1024/1024:.2f} MB -> {total_new_vid/1024/1024:.2f} MB")
    total_orig = total_orig_img + total_orig_vid
    total_new = total_new_img + total_new_vid
    saved = total_orig - total_new
    saved_pct = (saved / total_orig * 100) if total_orig > 0 else 0
    print(f"ESPAÇO TOTAL ECONOMIZADO: {saved/1024/1024:.2f} MB (-{saved_pct:.1f}%)")

if __name__ == '__main__':
    main()
