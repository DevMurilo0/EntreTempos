import os
import subprocess

# Roda a partir da RAIZ do repositório (mesmo padrão do optimize_images.py):
#   cd EntreTempos
#   python3 scripts/otimizacao_videos/optimize_videos.py
#
# Reencoda .mp4/.webm com TETO de bitrate (maxrate/minrate), em vez de CRF
# puro sem limite (-b:v 0). O CRF sozinho deixa o encoder "livre" pra gastar
# bitrate à vontade em cenas de muito movimento (ex.: gameplay como o do
# Ruan), o que gerou vídeos de ~4Mbps em 480p (86MB pra 2min49s). Com o teto,
# o mesmo trecho caiu pra ~900kbps sem perda visível de qualidade.

IGNORE_DIRS = {'.git', '.gemini', 'node_modules'}
VIDEO_EXTS = {'.mp4', '.webm'}

def optimize_video(filepath):
    try:
        orig_size = os.path.getsize(filepath)
        ext = os.path.splitext(filepath)[1].lower()
        tmp_path = filepath + ".tmp" + ext

        if ext == '.mp4':
            cmd = [
                'ffmpeg', '-y', '-i', filepath,
                '-c:v', 'libx264', '-crf', '28', '-preset', 'medium',
                '-maxrate', '2500k', '-bufsize', '5000k',
                '-vf', "scale='min(1920,iw)':-2",
                '-movflags', '+faststart',
                '-c:a', 'aac', '-b:a', '128k',
                tmp_path
            ]
        elif ext == '.webm':
            cmd = [
                'ffmpeg', '-y', '-i', filepath,
                '-c:v', 'libvpx-vp9', '-crf', '34',
                '-b:v', '800k', '-maxrate', '1000k', '-minrate', '400k',
                '-deadline', 'good', '-cpu-used', '2', '-g', '120', '-row-mt', '1',
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
            print(f"FFmpeg falhou em {filepath}: {result.stderr.decode('utf-8', errors='ignore')[-200:]}")
            return False, orig_size, orig_size
    except Exception as e:
        print(f"Erro ao otimizar vídeo {filepath}: {e}")
        return False, 0, 0

def main():
    print("Procurando vídeos a partir da pasta atual...")
    video_files = []
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for f in files:
            if os.path.splitext(f)[1].lower() in VIDEO_EXTS:
                video_files.append(os.path.join(root, f))

    print(f"Encontrados {len(video_files)} vídeos.\n")

    total_orig = 0
    total_new = 0
    count = 0

    for idx, path in enumerate(video_files, 1):
        rel = os.path.relpath(path, ".")
        size_mb = os.path.getsize(path) / 1024 / 1024
        print(f"[{idx}/{len(video_files)}] {rel} ({size_mb:.2f}MB)...", end="", flush=True)
        updated, orig, new = optimize_video(path)
        if updated:
            total_orig += orig
            total_new += new
            count += 1
            print(f" OK! {orig/1024/1024:.2f}MB -> {new/1024/1024:.2f}MB (-{(1 - new/orig)*100:.1f}%)")
        else:
            total_orig += orig
            total_new += orig
            print(" Mantido original (sem redução).")

    print("\n================ RESUMO ================")
    print(f"Vídeos otimizados: {count}/{len(video_files)}")
    if total_orig > 0:
        saved = total_orig - total_new
        print(f"Total: {total_orig/1024/1024:.2f}MB -> {total_new/1024/1024:.2f}MB (-{saved/total_orig*100:.1f}%)")

if __name__ == '__main__':
    main()