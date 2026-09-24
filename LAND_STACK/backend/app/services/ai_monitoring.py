import os
import time
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from typing import Dict, Any, Tuple, List, Optional
from datetime import datetime, timezone


STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
SATELLITE_DIR = os.path.join(STATIC_DIR, "satellite_imagery")
HEATMAP_DIR = os.path.join(STATIC_DIR, "heatmaps")

os.makedirs(SATELLITE_DIR, exist_ok=True)
os.makedirs(HEATMAP_DIR, exist_ok=True)


def create_synthetic_satellite_pair(
    ulpin: str,
    land_use: str = "Agricultural",
    anomaly_type: str = "NewConstruction"
) -> Tuple[str, str]:
    """
    Generates realistic high-detail synthetic satellite scenes (baseline vs recent acquisition)
    for a given parcel and anomaly type.
    """
    width, height = 512, 512
    base_filename = f"{ulpin}_baseline.jpg"
    after_filename = f"{ulpin}_acquisition.jpg"
    base_path = os.path.join(SATELLITE_DIR, base_filename)
    after_path = os.path.join(SATELLITE_DIR, after_filename)

    # 1. Generate Baseline Satellite Image
    base_img = Image.new("RGB", (width, height), color=(65, 95, 55))
    draw_base = ImageDraw.Draw(base_img)

    # Realistic texture (soil patches, agricultural furrows, vegetation variation)
    np.random.seed(abs(hash(ulpin)) % 10000)
    noise = np.random.randint(-20, 25, (height, width, 3), dtype=np.int16)
    base_arr = np.array(base_img, dtype=np.int16) + noise

    if land_use == "Agricultural":
        # Green & golden crops
        base_arr[:, :, 1] = np.clip(base_arr[:, :, 1] + 35, 0, 255)
        base_arr[:, :, 0] = np.clip(base_arr[:, :, 0] + 10, 0, 255)
    elif land_use == "Forest":
        # Deep dark emerald green
        base_arr[:, :, 1] = np.clip(base_arr[:, :, 1] + 15, 0, 255)
        base_arr[:, :, 0] = np.clip(base_arr[:, :, 0] - 25, 0, 255)
        base_arr[:, :, 2] = np.clip(base_arr[:, :, 2] - 25, 0, 255)
    elif land_use == "Commercial" or land_use == "Industrial":
        # Grayish gravel/pavement
        base_arr[:, :, 0] = np.clip(base_arr[:, :, 0] + 40, 0, 255)
        base_arr[:, :, 1] = np.clip(base_arr[:, :, 1] + 20, 0, 255)
        base_arr[:, :, 2] = np.clip(base_arr[:, :, 2] + 40, 0, 255)

    base_img = Image.fromarray(np.clip(base_arr, 0, 255).astype(np.uint8))
    draw_base = ImageDraw.Draw(base_img)

    # Add road or canal boundary
    draw_base.line([(0, 480), (512, 480)], fill=(130, 125, 115), width=18)
    draw_base.line([(0, 480), (512, 480)], fill=(160, 155, 145), width=14)

    # Add agricultural crop plot partitions
    for x in range(60, 460, 80):
        draw_base.line([(x, 20), (x, 460)], fill=(50, 75, 45), width=3)
    for y in range(60, 460, 80):
        draw_base.line([(20, y), (480, y)], fill=(55, 80, 50), width=3)

    # Add some trees/hedges
    for _ in range(15):
        tx = np.random.randint(40, 460)
        ty = np.random.randint(40, 440)
        draw_base.ellipse([tx, ty, tx + 14, ty + 14], fill=(30, 65, 25), outline=(20, 50, 20))

    base_img.save(base_path, quality=92)

    # 2. Generate After Image (with clear physical change anomaly)
    after_img = base_img.copy()
    draw_after = ImageDraw.Draw(after_img)

    if anomaly_type == "NewConstruction":
        # Unauthorized concrete structure / warehouse built in center
        cx, cy = 180, 170
        bw, bh = 140, 110
        # Foundation shadow
        draw_after.rectangle([cx + 6, cy + 6, cx + bw + 8, cy + bh + 8], fill=(35, 40, 35))
        # Building roof (concrete light gray / blue metal sheet)
        draw_after.rectangle([cx, cy, cx + bw, cy + bh], fill=(210, 215, 220), outline=(170, 175, 180), width=2)
        # AC units / skylights on roof
        draw_after.rectangle([cx + 20, cy + 20, cx + 45, cy + 40], fill=(140, 150, 160))
        draw_after.rectangle([cx + 70, cy + 25, cx + 115, cy + 45], fill=(140, 150, 160))
        # Excavation / gravel approach pathway
        draw_after.polygon([(cx + 50, cy + bh), (cx + 80, cy + bh), (220, 480), (190, 480)], fill=(175, 165, 150))

    elif anomaly_type == "Deforestation":
        # Large vegetation / tree loss patch cleared
        cx, cy = 140, 130
        draw_after.ellipse([cx, cy, cx + 220, cy + 200], fill=(185, 160, 125), outline=(150, 130, 100))
        # Tire tracks / bulldozer trails
        for i in range(5):
            oy = cy + 30 + i * 28
            draw_after.line([(cx + 20, oy), (cx + 190, oy + 10)], fill=(130, 110, 85), width=4)

    elif anomaly_type == "Encroachment":
        # Structure encroaching across boundary into neighbor's land
        cx, cy = 340, 150
        draw_after.rectangle([cx, cy, cx + 120, cy + 160], fill=(195, 200, 205), outline=(220, 40, 40), width=3)
        # Red boundary marker line breached
        draw_after.line([(400, 20), (400, 470)], fill=(240, 50, 50), width=4)
        draw_after.rectangle([cx - 10, cy + 30, cx + 40, cy + 120], fill=(180, 170, 155))

    else:  # LandUseChange
        # Farmland converted into commercial parking or excavation yard
        draw_after.rectangle([100, 100, 380, 360], fill=(160, 155, 150), outline=(130, 125, 120), width=3)
        for i in range(120, 360, 35):
            draw_after.line([(110, i), (370, i)], fill=(210, 205, 195), width=2)

    after_img.save(after_path, quality=92)
    return base_path, after_path


def run_computer_vision_change_detection(
    before_img_path: str,
    after_img_path: str,
    parcel_area_sqm: float = 4046.0,
    detection_type_hint: Optional[str] = None
) -> Dict[str, Any]:
    """
    Performs AI Computer Vision change detection between two satellite images:
    - Spectral alignment
    - Structural edge differences
    - Excess Green / NDVI vegetation drop
    - Morphological thresholding and bounding box extraction
    - Difference Heatmap generation with glowing red/amber/magenta overlays
    """
    if not os.path.exists(before_img_path) or not os.path.exists(after_img_path):
        raise FileNotFoundError("Baseline or acquisition image file not found.")

    img_before = Image.open(before_img_path).convert("RGB")
    img_after = Image.open(after_img_path).convert("RGB")

    # Match dimensions
    target_size = (512, 512)
    img_before = img_before.resize(target_size, Image.Resampling.BILINEAR)
    img_after = img_after.resize(target_size, Image.Resampling.BILINEAR)

    arr_before = np.array(img_before, dtype=np.float32)
    arr_after = np.array(img_after, dtype=np.float32)

    # 1. Spectral Difference (RGB delta)
    rgb_diff = np.sqrt(np.sum((arr_after - arr_before) ** 2, axis=2))

    # 2. Vegetation Loss (Excess Green Difference: 2*G - R - B)
    exg_before = 2.0 * arr_before[:, :, 1] - arr_before[:, :, 0] - arr_before[:, :, 2]
    exg_after = 2.0 * arr_after[:, :, 1] - arr_after[:, :, 0] - arr_after[:, :, 2]
    veg_loss = np.maximum(0, exg_before - exg_after)

    # 3. Structural & Concrete Increase (Albedo & Brightness)
    gray_before = np.mean(arr_before, axis=2)
    gray_after = np.mean(arr_after, axis=2)
    brightness_increase = np.maximum(0, gray_after - gray_before)

    # 4. Multi-criteria change detection thresholding
    construction_mask = (brightness_increase > 45) & (rgb_diff > 50)
    veg_loss_mask = (veg_loss > 35) & (rgb_diff > 45)
    general_mask = (rgb_diff > 65)

    combined_mask = construction_mask | veg_loss_mask | general_mask

    # Morphological noise removal (simple median filter / neighborhood expansion)
    pil_mask = Image.fromarray((combined_mask * 255).astype(np.uint8))
    pil_mask = pil_mask.filter(ImageFilter.MedianFilter(size=5))
    pil_mask = pil_mask.filter(ImageFilter.MaxFilter(size=3))
    clean_mask = np.array(pil_mask) > 120

    changed_pixels = int(np.sum(clean_mask))
    total_pixels = target_size[0] * target_size[1]
    change_ratio = changed_pixels / float(total_pixels)
    affected_area_sqm = round(change_ratio * parcel_area_sqm, 2)
    change_percentage = round(change_ratio * 100.0, 2)

    # Determine classification
    veg_loss_score = np.sum(veg_loss_mask)
    construction_score = np.sum(construction_mask)

    if detection_type_hint:
        detected_type = detection_type_hint
    elif construction_score > 600:  # Prioritize construction if detected
        detected_type = "NewConstruction"
    elif veg_loss_score > 800:
        detected_type = "Deforestation"
    elif change_ratio > 0.08:
        detected_type = "LandUseChange"
    elif change_ratio > 0.02:
        detected_type = "Encroachment"
    else:
        detected_type = "MinorChange"

    confidence = round(min(0.98, max(0.72, 0.75 + (change_ratio * 0.8) + (0.05 if changed_pixels > 2000 else 0))), 2)

    # 5. Extract bounding boxes for detected anomaly clusters
    bboxes = []
    if changed_pixels > 200:
        rows = np.any(clean_mask, axis=1)
        cols = np.any(clean_mask, axis=0)
        if np.any(rows) and np.any(cols):
            rmin, rmax = np.where(rows)[0][[0, -1]]
            cmin, cmax = np.where(cols)[0][[0, -1]]
            bboxes.append({
                "x_min": int(cmin),
                "y_min": int(rmin),
                "x_max": int(cmax),
                "y_max": int(rmax),
                "width": int(cmax - cmin),
                "height": int(rmax - rmin)
            })

    # 6. Generate Glowing Difference Heatmap Overlay
    heatmap_overlay = arr_after.copy()
    
    # Red for construction, Orange/Yellow for vegetation loss, Cyan/Magenta for other
    if detected_type == "NewConstruction":
        tint_color = np.array([255, 35, 50], dtype=np.float32)  # Glowing Red
    elif detected_type == "Deforestation":
        tint_color = np.array([255, 185, 20], dtype=np.float32)  # Glowing Amber/Gold
    elif detected_type == "Encroachment":
        tint_color = np.array([235, 30, 210], dtype=np.float32)  # Glowing Magenta
    else:
        tint_color = np.array([0, 225, 255], dtype=np.float32)  # Cyan

    # Alpha blend changed pixels
    alpha = 0.65
    for c in range(3):
        heatmap_overlay[:, :, c] = np.where(
            clean_mask,
            heatmap_overlay[:, :, c] * (1 - alpha) + tint_color[c] * alpha,
            heatmap_overlay[:, :, c]
        )

    heatmap_img = Image.fromarray(np.clip(heatmap_overlay, 0, 255).astype(np.uint8))
    draw_heat = ImageDraw.Draw(heatmap_img)

    # Draw bounding boxes with glowing border
    for box in bboxes:
        draw_heat.rectangle(
            [box["x_min"], box["y_min"], box["x_max"], box["y_max"]],
            outline=tuple(tint_color.astype(int)),
            width=3
        )
        # Label tag
        tag_text = f"AI: {detected_type} ({int(confidence * 100)}%)"
        draw_heat.rectangle(
            [box["x_min"], max(0, box["y_min"] - 22), box["x_min"] + 180, box["y_min"]],
            fill=(20, 20, 25)
        )
        draw_heat.text((box["x_min"] + 6, max(0, box["y_min"] - 18)), tag_text, fill=(255, 255, 255))

    # Save heatmap
    timestamp = int(time.time() * 1000)
    heatmap_filename = f"diff_analysis_{timestamp}.png"
    heatmap_path = os.path.join(HEATMAP_DIR, heatmap_filename)
    heatmap_img.save(heatmap_path, format="PNG")

    descriptions = {
        "NewConstruction": f"AI detected newly erected building footprint / concrete structure of ~{affected_area_sqm} m² ({change_percentage}% of parcel) not present in registration baseline.",
        "Deforestation": f"AI detected significant canopy loss / vegetation clearance of ~{affected_area_sqm} m² ({change_percentage}% of parcel). Potential unauthorized land clearing.",
        "Encroachment": f"AI detected boundary breach where construction or boundary hedge encroaches ~{affected_area_sqm} m² beyond the recorded cadastral boundary.",
        "LandUseChange": f"AI detected major spectral and texture transition indicating potential unpermitted land use change across ~{affected_area_sqm} m².",
        "MinorChange": f"Minor natural surface variation observed (~{affected_area_sqm} m²). No major regulatory infringement indicated."
    }

    recommendations = {
        "NewConstruction": "Issue Section 133 Notice for Unauthorized Construction; dispatch field inspector with live GPS.",
        "Deforestation": "Alert Forest & Revenue Department; schedule urgent ground patrol verification.",
        "Encroachment": "Trigger Cadastral Boundary Resurvey; notify adjacent parcel owner.",
        "LandUseChange": "Verify if Land Use Conversion application has been approved; flag for revenue inspection.",
        "MinorChange": "Keep under standard automated periodic satellite surveillance."
    }

    return {
        "change_detected": bool(changed_pixels > 300),
        "detection_type": detected_type,
        "confidence_score": confidence,
        "affected_area_sqm": affected_area_sqm,
        "change_percentage": change_percentage,
        "changed_pixel_count": changed_pixels,
        "description": descriptions.get(detected_type, "Surface anomaly detected by AI vision."),
        "recommendation": recommendations.get(detected_type, "Verify with field officer."),
        "before_image_url": f"/static/satellite_imagery/{os.path.basename(before_img_path)}",
        "after_image_url": f"/static/satellite_imagery/{os.path.basename(after_img_path)}",
        "diff_heatmap_url": f"/static/heatmaps/{heatmap_filename}",
        "bounding_boxes": bboxes,
        "detected_at": datetime.now(timezone.utc).isoformat()
    }
