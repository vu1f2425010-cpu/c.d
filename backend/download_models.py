import os
import urllib.request
import zipfile

def download_easyocr_models():
    model_dir = os.path.expanduser("~/.EasyOCR/model")
    os.makedirs(model_dir, exist_ok=True)
    
    det_path = os.path.join(model_dir, "craft_mlt_25k.pth")
    rec_path = os.path.join(model_dir, "english_g2.pth")

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    # 1. Craft detector
    if not os.path.exists(det_path):
        print("Downloading craft detector from GitHub...")
        url1 = "https://github.com/JaidedAI/EasyOCR/releases/download/pre-v1.1.6/craft_mlt_25k.zip"
        zip1_path = os.path.join(model_dir, "craft.zip")
        req = urllib.request.Request(url1, headers=headers)
        with urllib.request.urlopen(req, timeout=120) as resp, open(zip1_path, "wb") as out_file:
            out_file.write(resp.read())
        with zipfile.ZipFile(zip1_path, "r") as z:
            z.extractall(model_dir)
        if os.path.exists(zip1_path):
            os.remove(zip1_path)
        print("Craft detector extracted successfully.")

    # 2. English recognizer
    if not os.path.exists(rec_path):
        print("Downloading english recognizer from GitHub...")
        url2 = "https://github.com/JaidedAI/EasyOCR/releases/download/v1.3/english_g2.zip"
        zip2_path = os.path.join(model_dir, "english.zip")
        req = urllib.request.Request(url2, headers=headers)
        with urllib.request.urlopen(req, timeout=120) as resp, open(zip2_path, "wb") as out_file:
            out_file.write(resp.read())
        with zipfile.ZipFile(zip2_path, "r") as z:
            z.extractall(model_dir)
        if os.path.exists(zip2_path):
            os.remove(zip2_path)
        print("English recognizer extracted successfully.")

    print("All EasyOCR models cached in:", model_dir, os.listdir(model_dir))
    return True

if __name__ == "__main__":
    download_easyocr_models()
