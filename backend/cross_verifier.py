import io
import base64
import math
import numpy as np
import cv2
from PIL import Image
from skimage.metrics import structural_similarity as ssim

def image_to_base64(cv_img: np.ndarray, ext: str = ".png") -> str:
    """Convert OpenCV BGR image to base64 Data URL string."""
    _, buffer = cv2.imencode(ext, cv_img)
    b64_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"

def detect_text_regions_mask(gray_img: np.ndarray) -> np.ndarray:
    """
    Detect text/name regions using MSER or morphological gradient
    so we can ignore text differences and only compare structural design.
    """
    # Morphological gradient to highlight high frequency text strokes
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 3))
    grad = cv2.morphologyEx(gray_img, cv2.MORPH_GRADIENT, kernel)
    _, thresh = cv2.threshold(grad, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    
    # Close horizontal gaps between letters in a line
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    # Text mask: 255 for non-text (design/borders/seals), 0 for text regions
    mask = np.ones_like(gray_img, dtype=np.uint8) * 255
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    img_h, img_w = gray_img.shape
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        # Filter typical text lines (wide aspect ratio, middle region, not full-width border)
        if 20 < w < img_w * 0.85 and 8 < h < img_h * 0.25:
            # Mask out text area
            cv2.rectangle(mask, (max(0, x - 5), max(0, y - 3)), (min(img_w, x + w + 5), min(img_h, y + h + 3)), 0, -1)
            
    return mask

def extract_seal_coordinates(gray_img: np.ndarray):
    """Detect circular seal or emblem location and radius."""
    circles = cv2.HoughCircles(
        gray_img, cv2.HOUGH_GRADIENT, dp=1.2, minDist=80,
        param1=50, param2=30, minRadius=25, maxRadius=140
    )
    if circles is not None:
        circles = np.round(circles[0, :]).astype("int")
        # Return best candidate
        best_circle = circles[0]
        return {
            "detected": True,
            "x": int(best_circle[0]),
            "y": int(best_circle[1]),
            "radius": int(best_circle[2])
        }
    return {"detected": False, "x": 0, "y": 0, "radius": 0}

def measure_borders(gray_img: np.ndarray):
    """Measure border margin distances (Top, Bottom, Left, Right)."""
    edges = cv2.Canny(gray_img, 50, 150)
    h, w = gray_img.shape
    
    # Horizontal projection
    row_sums = np.sum(edges, axis=1)
    col_sums = np.sum(edges, axis=0)
    
    top_margin = 0
    for i in range(h // 4):
        if row_sums[i] > w * 30:
            top_margin = i
            break
            
    bottom_margin = 0
    for i in range(h - 1, h - h // 4, -1):
        if row_sums[i] > w * 30:
            bottom_margin = h - 1 - i
            break
            
    left_margin = 0
    for j in range(w // 4):
        if col_sums[j] > h * 30:
            left_margin = j
            break
            
    right_margin = 0
    for j in range(w - 1, w - w // 4, -1):
        if col_sums[j] > h * 30:
            right_margin = w - 1 - j
            break
            
    return {
        "top": int(top_margin),
        "bottom": int(bottom_margin),
        "left": int(left_margin),
        "right": int(right_margin)
    }

def cross_verify_certificates(real_pil: Image.Image, test_pil: Image.Image):
    """
    Cross-verifies candidate certificate against reference authentic certificate.
    Compares structural alignment, borders, guilloché curves, and measurements
    while ignoring text/name content.
    """
    # 1. Normalize dimensions to standardized reference canvas (1000 x 700)
    canvas_w, canvas_h = 1000, 700
    
    real_cv = cv2.cvtColor(np.array(real_pil.convert("RGB")), cv2.COLOR_RGB2BGR)
    test_cv = cv2.cvtColor(np.array(test_pil.convert("RGB")), cv2.COLOR_RGB2BGR)
    
    orig_real_w, orig_real_h = real_pil.size
    orig_test_w, orig_test_h = test_pil.size
    aspect_ratio_real = round(orig_real_w / max(1, orig_real_h), 3)
    aspect_ratio_test = round(orig_test_w / max(1, orig_test_h), 3)
    aspect_ratio_delta = round(abs(aspect_ratio_real - aspect_ratio_test), 3)
    aspect_ratio_score = max(0.0, 100.0 - (aspect_ratio_delta * 120.0))

    real_resized = cv2.resize(real_cv, (canvas_w, canvas_h))
    test_resized = cv2.resize(test_cv, (canvas_w, canvas_h))

    real_gray = cv2.cvtColor(real_resized, cv2.COLOR_BGR2GRAY)
    test_gray = cv2.cvtColor(test_resized, cv2.COLOR_BGR2GRAY)

    # 2. Extract Text-Excluded Masks for purely design/layout comparison
    real_text_mask = detect_text_regions_mask(real_gray)
    test_text_mask = detect_text_regions_mask(test_gray)
    combined_design_mask = cv2.bitwise_and(real_text_mask, test_text_mask)

    # 3. Structural Similarity Index (SSIM) on Design Layout
    # Mask out text so different names do NOT penalize design match
    real_design = cv2.bitwise_and(real_gray, real_gray, mask=combined_design_mask)
    test_design = cv2.bitwise_and(test_gray, test_gray, mask=combined_design_mask)
    
    ssim_score, diff_map = ssim(real_design, test_design, full=True)
    ssim_percentage = round(max(0.0, min(100.0, ssim_score * 100.0)), 1)

    # 4. Feature Matching & Homography (ORB)
    orb = cv2.ORB_create(nfeatures=1200)
    kp1, des1 = orb.detectAndCompute(real_gray, combined_design_mask)
    kp2, des2 = orb.detectAndCompute(test_gray, combined_design_mask)

    match_count = 0
    good_matches = []
    rotation_angle = 0.0
    
    if des1 is not None and des2 is not None and len(des1) > 10 and len(des2) > 10:
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)
        matches = sorted(matches, key=lambda x: x.distance)
        good_matches = [m for m in matches if m.distance < 55]
        match_count = len(good_matches)
        
        if len(good_matches) >= 4:
            src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
            dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)
            M, mask_homo = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
            if M is not None:
                # Calculate rotation angle in degrees from homography matrix
                rotation_angle = round(math.degrees(math.atan2(M[1, 0], M[0, 0])), 2)

    keypoint_match_score = round(min(100.0, (match_count / max(1, min(len(kp1 or []), len(kp2 or [])))) * 150.0), 1)

    # 5. Measure Border Margins & Geometry
    real_borders = measure_borders(real_gray)
    test_borders = measure_borders(test_gray)
    
    border_delta_top = abs(real_borders["top"] - test_borders["top"])
    border_delta_left = abs(real_borders["left"] - test_borders["left"])
    border_delta_right = abs(real_borders["right"] - test_borders["right"])
    border_delta_bottom = abs(real_borders["bottom"] - test_borders["bottom"])
    avg_border_delta = round((border_delta_top + border_delta_left + border_delta_right + border_delta_bottom) / 4.0, 1)
    border_score = round(max(0.0, 100.0 - (avg_border_delta * 4.0)), 1)

    # 6. Seal / Emblem Placement & Radius Measurement
    real_seal = extract_seal_coordinates(real_gray)
    test_seal = extract_seal_coordinates(test_gray)
    
    seal_pos_delta_px = 0.0
    seal_radius_delta_px = 0.0
    seal_alignment_score = 95.0
    
    if real_seal["detected"] and test_seal["detected"]:
        seal_pos_delta_px = round(math.sqrt((real_seal["x"] - test_seal["x"])**2 + (real_seal["y"] - test_seal["y"])**2), 1)
        seal_radius_delta_px = abs(real_seal["radius"] - test_seal["radius"])
        seal_alignment_score = round(max(0.0, 100.0 - (seal_pos_delta_px * 0.8) - (seal_radius_delta_px * 1.5)), 1)
    elif real_seal["detected"] != test_seal["detected"]:
        seal_alignment_score = 30.0
    else:
        seal_alignment_score = 85.0 # Both without circular seal (classic style)

    # 7. Edge & Guilloché Pattern Alignment
    real_canny = cv2.Canny(real_design, 60, 160)
    test_canny = cv2.Canny(test_design, 60, 160)
    edge_diff = cv2.absdiff(real_canny, test_canny)
    edge_alignment_score = round(max(10.0, 100.0 - (float(np.mean(edge_diff)) * 2.2)), 1)

    # 8. Overall Weighted Structural Design Similarity Score
    overall_similarity = round(
        (ssim_percentage * 0.35) +
        (keypoint_match_score * 0.25) +
        (border_score * 0.20) +
        (seal_alignment_score * 0.10) +
        (edge_alignment_score * 0.10),
        1
    )
    overall_similarity = max(10.0, min(99.6, overall_similarity))

    # 9. Generate Circled Difference Visualizer & Heatmap
    # Create high-visibility annotated image with bright red circles on every difference
    circled_test_img = test_resized.copy()
    diff_uint8 = (diff_map * 255).astype("uint8")
    
    # Threshold discrepancy regions
    # Invert so 255 = maximum mismatch
    discrepancy_map = 255 - diff_uint8
    _, thresh_diff = cv2.threshold(discrepancy_map, 65, 255, cv2.THRESH_BINARY)
    
    # Mask out dynamic text regions so circles ONLY target design/border/seal differences
    design_thresh = cv2.bitwise_and(thresh_diff, thresh_diff, mask=combined_design_mask)
    contours_diff, _ = cv2.findContours(design_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    mismatch_circles = []
    idx = 1

    # Check for seal displacement and circle it
    if real_seal["detected"] and test_seal["detected"]:
        if seal_pos_delta_px > 10.0 or seal_radius_delta_px > 5.0:
            sx, sy, sr = test_seal["x"], test_seal["y"], test_seal["radius"]
            cv2.circle(circled_test_img, (sx, sy), sr + 12, (0, 0, 255), 3)
            cv2.circle(circled_test_img, (sx, sy), sr + 18, (0, 165, 255), 1)
            cv2.putText(
                circled_test_img, f"SEAL OFFSET #{idx} (Shift: {seal_pos_delta_px}px)",
                (max(10, sx - sr - 20), max(20, sy - sr - 10)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 2
            )
            mismatch_circles.append({
                "id": idx,
                "label": f"Seal & Emblem Position Shift ({seal_pos_delta_px}px offset)",
                "x": sx, "y": sy, "radius": sr + 12
            })
            idx += 1

    # Check for border frame displacement and circle corners/margins
    if avg_border_delta > 6.0:
        # Highlight top-left and bottom-right frame corners
        for cx, cy in [(test_borders["left"] + 20, test_borders["top"] + 20), (canvas_w - test_borders["right"] - 20, canvas_h - test_borders["bottom"] - 20)]:
            cv2.circle(circled_test_img, (cx, cy), 35, (0, 0, 255), 3)
            cv2.circle(circled_test_img, (cx, cy), 42, (0, 165, 255), 1)
        
        cv2.putText(
            circled_test_img, f"BORDER MARGIN DELTA #{idx} (Δ{avg_border_delta}px)",
            (test_borders["left"] + 25, test_borders["top"] + 70),
            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 2
        )
        mismatch_circles.append({
            "id": idx,
            "label": f"Border & Frame Margin Shift (Δ{avg_border_delta}px)",
            "x": test_borders["left"] + 20, "y": test_borders["top"] + 20, "radius": 35
        })
        idx += 1

    # Circle general geometric & texture discrepancies
    for c in contours_diff:
        area = cv2.contourArea(c)
        if area > 180: # Meaningful design difference
            x, y, w, h = cv2.boundingRect(c)
            center_x = int(x + w / 2)
            center_y = int(y + h / 2)
            circle_radius = int(max(w, h) / 2 + 10)
            
            # Avoid overlapping with seal already circled
            is_near_seal = (
                test_seal["detected"] and
                math.sqrt((center_x - test_seal["x"])**2 + (center_y - test_seal["y"])**2) < test_seal["radius"] + 25
            )
            if not is_near_seal and idx <= 8:
                # Draw thick glowing red circle
                cv2.circle(circled_test_img, (center_x, center_y), circle_radius, (0, 0, 255), 3)
                # Outer orange halo
                cv2.circle(circled_test_img, (center_x, center_y), circle_radius + 5, (0, 165, 255), 1)
                
                # Label tag
                cv2.putText(
                    circled_test_img, f"DIFF #{idx}",
                    (max(10, center_x - circle_radius), max(20, center_y - circle_radius - 8)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 2
                )
                mismatch_circles.append({
                    "id": idx,
                    "label": f"Geometric Contour Variance #{idx}",
                    "x": center_x, "y": center_y, "radius": circle_radius
                })
                idx += 1

    # Diff heatmap overlay
    diff_colored = cv2.applyColorMap(discrepancy_map, cv2.COLORMAP_JET)
    diff_overlay = cv2.addWeighted(test_resized, 0.65, diff_colored, 0.35, 0)
    for mc in mismatch_circles:
        cv2.circle(diff_overlay, (mc["x"], mc["y"]), mc["radius"], (0, 0, 255), 2)

    # Keypoints match image (Side-by-side lines)
    if good_matches:
        match_draw_img = cv2.drawMatches(
            real_resized, kp1, test_resized, kp2, good_matches[:40], None,
            flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS
        )
    else:
        match_draw_img = np.hstack([real_resized, test_resized])

    circled_img_b64 = image_to_base64(circled_test_img)
    diff_heatmap_b64 = image_to_base64(diff_overlay)
    keypoint_overlay_b64 = image_to_base64(match_draw_img)

    # 10. STRICT 1% TOLERANCE VERDICT DETERMINATION
    # If difference >= 1.0% (i.e. similarity < 99.0% or differences found), it is flagged as FAKE / FORGED
    difference_percentage = round(100.0 - overall_similarity, 1)
    has_meaningful_differences = len(mismatch_circles) > 0 or difference_percentage >= 1.0

    if not has_meaningful_differences and overall_similarity >= 99.0:
        verdict = "AUTHENTIC"
        verdict_color = "#10B981" # Emerald Green
        verdict_title = "100% AUTHENTIC DESIGN MATCH"
        verdict_summary = f"100% Genuine Design Match ({overall_similarity}%): Conforms within strict 1% tolerance threshold. Zero geometric discrepancies detected."
    else:
        verdict = "FORGED"
        verdict_color = "#FF0055" # Cyber Crimson
        verdict_title = "FAKE CERTIFICATE (STRUCTURAL DESIGN MISMATCH)"
        verdict_summary = f"CRITICAL FORENSIC ALERT: Detected {difference_percentage}% design discrepancy ({len(mismatch_circles)} circled differences). Exceeds 1.0% tolerance limit. Certificate classified as FAKE / FORGED."

    return {
        "verdict": verdict,
        "verdict_title": verdict_title,
        "verdict_color": verdict_color,
        "similarity_score": overall_similarity,
        "difference_percentage": difference_percentage,
        "summary": verdict_summary,
        "circled_anomalies_img": circled_img_b64,
        "diff_heatmap": diff_heatmap_b64,
        "keypoint_matches_img": keypoint_overlay_b64,
        "mismatch_regions_count": len(mismatch_circles),
        "mismatch_circles": mismatch_circles,
        "measurements": {
            "ssim_structure": {
                "score": ssim_percentage,
                "label": "Structural Similarity Index (SSIM)",
                "status": "PASS" if ssim_percentage >= 99.0 else "FAIL (Exceeds 1% Tolerance)"
            },
            "keypoint_alignment": {
                "score": keypoint_match_score,
                "matched_features": match_count,
                "rotation_degrees": rotation_angle,
                "label": "Geometric Keypoint Homography",
                "status": "PASS" if keypoint_match_score >= 90.0 else "FAIL (Exceeds 1% Tolerance)"
            },
            "border_geometry": {
                "score": border_score,
                "avg_margin_delta_px": avg_border_delta,
                "margins_real": real_borders,
                "margins_test": test_borders,
                "label": "Border & Frame Margin Precision",
                "status": "PASS" if avg_border_delta <= 1.5 else f"FAIL (Δ{avg_border_delta}px Shift)"
            },
            "seal_emblem_placement": {
                "score": seal_alignment_score,
                "pos_delta_px": seal_pos_delta_px,
                "radius_delta_px": seal_radius_delta_px,
                "real_detected": real_seal["detected"],
                "test_detected": test_seal["detected"],
                "label": "Emblem & Seal Coordinate Delta",
                "status": "PASS" if seal_pos_delta_px <= 3.0 else f"FAIL (Δ{seal_pos_delta_px}px Shift)"
            },
            "edge_guilloche": {
                "score": edge_alignment_score,
                "label": "Guilloché & Pattern Edge Correlation",
                "status": "PASS" if edge_alignment_score >= 95.0 else "FAIL (Pattern Delta)"
            },
            "aspect_ratio": {
                "score": round(aspect_ratio_score, 1),
                "real_ratio": aspect_ratio_real,
                "test_ratio": aspect_ratio_test,
                "delta": aspect_ratio_delta,
                "label": "Canvas Aspect Ratio Uniformity"
            }
        }
    }
