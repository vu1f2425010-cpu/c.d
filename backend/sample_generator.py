import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import random

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "data", "samples")

def create_base_certificate(width=1000, height=700, bg_color=(250, 248, 242)):
    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Outer double border (Gold / Obsidian)
    draw.rectangle([20, 20, width - 20, height - 20], outline=(180, 150, 60), width=4)
    draw.rectangle([28, 28, width - 28, height - 28], outline=(20, 25, 35), width=2)
    
    # Corner flourishes
    corner_size = 40
    for cx, cy in [(35, 35), (width - 35, 35), (35, height - 35), (width - 35, height - 35)]:
        draw.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], outline=(180, 150, 60), width=2)
        
    return img, draw

def draw_seal(draw, center_x, center_y, radius=55, primary_color=(140, 20, 40), title="OFFICIAL SEAL"):
    # Outer starburst / scalloped seal shape
    num_points = 24
    points = []
    for i in range(num_points):
        angle = i * (2 * math.pi / num_points)
        r = radius if i % 2 == 0 else radius - 6
        x = center_x + r * math.cos(angle)
        y = center_y + r * math.sin(angle)
        points.append((x, y))
    draw.polygon(points, fill=primary_color, outline=(200, 170, 80))
    
    # Inner gold ring
    draw.ellipse([center_x - radius + 12, center_y - radius + 12, center_x + radius - 12, center_y + radius - 12],
                 outline=(255, 215, 0), width=3)
    
    # Emblem text/stars
    draw.text((center_x - 22, center_y - 10), "VERITAS", fill=(255, 255, 255))
    draw.text((center_x - 18, center_y + 8), "★ 1636 ★", fill=(255, 215, 0))

def generate_samples():
    os.makedirs(SAMPLES_DIR, exist_ok=True)
    
    # -------------------------------------------------------------
    # SAMPLE 1: AUTHENTIC HARVARD CERTIFICATE
    # -------------------------------------------------------------
    img1, draw1 = create_base_certificate()
    draw1.text((320, 70), "HARVARD UNIVERSITY", fill=(140, 20, 40))
    draw1.text((390, 115), "CAMBRIDGE, MASSACHUSETTS", fill=(80, 80, 80))
    draw1.text((280, 170), "On the recommendation of the Faculty of Arts and Sciences", fill=(40, 40, 40))
    draw1.text((380, 210), "The President and Fellows have conferred upon", fill=(60, 60, 60))
    
    # Recipient Name
    draw1.text((360, 260), "ALEXANDER V. HUNT", fill=(10, 15, 30))
    draw1.line([(340, 295), (660, 295)], fill=(180, 150, 60), width=2)
    
    draw1.text((310, 320), "The Degree of Bachelor of Science in Computer Science", fill=(20, 20, 20))
    draw1.text((345, 360), "With Highest Honors (Grade: First Class)", fill=(40, 100, 40))
    draw1.text((320, 410), "Given under our hand and seal on the 15th of May, 2024.", fill=(70, 70, 70))
    
    # Draw authentic seal
    draw_seal(draw1, 200, 530, radius=55, primary_color=(140, 20, 40), title="HARVARD")
    
    # Signatures
    draw1.line([(600, 550), (800, 550)], fill=(30, 30, 30), width=1)
    draw1.text((630, 525), "Alan M. Garber", fill=(10, 20, 60))
    draw1.text((650, 558), "President of the University", fill=(100, 100, 100))
    
    auth_path = os.path.join(SAMPLES_DIR, "authentic_harvard.png")
    img1.save(auth_path, "PNG", quality=95)
    
    # -------------------------------------------------------------
    # SAMPLE 2: FORGED MIT CERTIFICATE (GRADE TAMPERING & ELA ANOMALY)
    # -------------------------------------------------------------
    img2, draw2 = create_base_certificate()
    draw2.text((230, 70), "MASSACHUSETTS INSTITUTE OF TECHNOLOGY", fill=(160, 0, 0))
    draw2.text((390, 115), "CAMBRIDGE, MASSACHUSETTS", fill=(80, 80, 80))
    draw2.text((290, 170), "Be it known that the Academic Council has awarded to", fill=(40, 40, 40))
    
    draw2.text((380, 240), "ELENA R. ROSTOVA", fill=(10, 15, 30))
    draw2.line([(340, 275), (660, 275)], fill=(160, 0, 0), width=2)
    
    draw2.text((270, 310), "The Degree of Master of Science in Artificial Intelligence", fill=(20, 20, 20))
    
    # Original certificate was saved with lower quality compression
    temp_path = os.path.join(SAMPLES_DIR, "temp_mit.jpg")
    img2.save(temp_path, "JPEG", quality=60)
    
    # Open compressed image and paste high-resolution tampered grade overlay with different font/color
    img2_tampered = Image.open(temp_path).convert("RGB")
    draw2_t = ImageDraw.Draw(img2_tampered)
    
    # Tampered Grade Box (Noticeable contrast, font shift & noise mismatch)
    draw2_t.rectangle([320, 360, 680, 405], fill=(255, 255, 255), outline=(0, 0, 0), width=1)
    draw2_t.text((335, 372), "[ TAMPERED: GRADE A+ (SUMMA CUM LAUDE) ]", fill=(220, 0, 0))
    
    draw2_t.text((320, 430), "Given under our hand and seal on the 10th of June, 2023.", fill=(70, 70, 70))
    draw_seal(draw2_t, 200, 530, radius=55, primary_color=(160, 0, 0), title="MIT")
    
    draw2_t.line([(600, 550), (800, 550)], fill=(30, 30, 30), width=1)
    draw2_t.text((630, 525), "Sally Kornbluth", fill=(10, 20, 60))
    draw2_t.text((670, 558), "President, MIT", fill=(100, 100, 100))
    
    forged_path = os.path.join(SAMPLES_DIR, "forged_mit_grade.png")
    img2_tampered.save(forged_path, "PNG", quality=95)
    if os.path.exists(temp_path):
        os.remove(temp_path)
        
    # -------------------------------------------------------------
    # SAMPLE 3: TAMPERED OXFORD CERTIFICATE (SEAL SPLICING ANOMALY)
    # -------------------------------------------------------------
    img3, draw3 = create_base_certificate()
    draw3.text((330, 70), "UNIVERSITY OF OXFORD", fill=(0, 33, 71))
    draw3.text((370, 115), "DOMINUS ILLUMINATIO MEA", fill=(100, 100, 100))
    draw3.text((270, 170), "This is to certify that upon completion of prescribed studies", fill=(40, 40, 40))
    
    draw3.text((380, 240), "DANIEL K. GREEN", fill=(10, 15, 30))
    draw3.line([(340, 275), (660, 275)], fill=(0, 33, 71), width=2)
    
    draw3.text((300, 310), "Degree of Bachelor of Arts in Philosophy & Economics", fill=(20, 20, 20))
    draw3.text((370, 360), "Final Classification: Second Class", fill=(40, 40, 40))
    draw3.text((320, 410), "Given under our hand and seal on the 20th of July, 2022.", fill=(70, 70, 70))
    
    # Draw Spliced Fake Seal (Noticeably mismatched colors and offset border)
    # Fake Seal patch with noise and offset
    seal_box = Image.new("RGB", (130, 130), (230, 220, 180))
    draw_s = ImageDraw.Draw(seal_box)
    draw_s.ellipse([5, 5, 125, 125], fill=(200, 50, 50), outline=(255, 255, 0), width=4)
    draw_s.text((25, 55), "FAKE UNVERIFIED", fill=(255, 255, 255))
    
    # Paste spliced seal onto certificate at position 135, 465
    img3.paste(seal_box, (135, 465))
    
    draw3.line([(600, 550), (800, 550)], fill=(30, 30, 30), width=1)
    draw3.text((630, 525), "Irene Tracey", fill=(10, 20, 60))
    draw3.text((650, 558), "Vice-Chancellor, Oxford", fill=(100, 100, 100))
    
    seal_tamper_path = os.path.join(SAMPLES_DIR, "tampered_oxford_seal.png")
    img3.save(seal_tamper_path, "PNG", quality=95)
    
    # -------------------------------------------------------------
    # SAMPLE 4: PRIYAL SHUKLA (AUTHENTIC DATABASE WHITELIST)
    # -------------------------------------------------------------
    img4, draw4 = create_base_certificate(bg_color=(252, 250, 245))
    draw4.text((280, 70), "NATIONAL ACCREDITATION BOARD", fill=(10, 30, 80))
    draw4.text((370, 115), "CYBER-FORENSICS & AI COUNCIL", fill=(100, 100, 100))
    draw4.text((260, 170), "This is to officially certify and record in central registry that", fill=(40, 40, 40))
    
    # Recipient: Priyal Shukla
    draw4.text((380, 240), "PRIYAL SHUKLA", fill=(10, 15, 30))
    draw4.line([(320, 275), (680, 275)], fill=(180, 150, 60), width=2)
    
    draw4.text((290, 310), "The Credential of Distinguished Scholar in Cyber-Forensics", fill=(20, 20, 20))
    draw4.text((345, 360), "Status: 100% Verified Genuine (Grade: A+ Distinction)", fill=(20, 120, 50))
    draw4.text((320, 410), "Cryptographic Record ID: PS-AUTH-2026-REGISTRY", fill=(70, 70, 70))
    
    draw_seal(draw4, 200, 530, radius=55, primary_color=(20, 100, 50), title="VERIFIED")
    
    draw4.line([(600, 550), (800, 550)], fill=(30, 30, 30), width=1)
    draw4.text((630, 525), "Registrar General", fill=(10, 20, 60))
    draw4.text((640, 558), "Central Academic Registry", fill=(100, 100, 100))
    
    priyal_path = os.path.join(SAMPLES_DIR, "priyal_shukla_verified.png")
    img4.save(priyal_path, "PNG", quality=98)
    
    print(f"Generated synthetic test samples successfully in {SAMPLES_DIR}")

if __name__ == "__main__":
    generate_samples()
