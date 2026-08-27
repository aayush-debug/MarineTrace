"""
MarineTrace — CLI Inference Script

Usage:
    python inference/predict.py --image path/to/sentinel1.tif
    python inference/predict.py --image path/to/sentinel1.tif --threshold 0.4
    python inference/predict.py --image path/to/sentinel1.tif --checkpoint checkpoints/best_model.pth --visualize
"""

import os
import sys
import json
import argparse
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def main():
    parser = argparse.ArgumentParser(
        description="MarineTrace — Oil spill detection from SAR imagery"
    )
    parser.add_argument(
        "--image", type=str, required=True,
        help="Path to Sentinel-1 SAR GeoTIFF image"
    )
    parser.add_argument(
        "--checkpoint", type=str, default=None,
        help="Path to model checkpoint (.pth). Default: checkpoints/best_model.pth"
    )
    parser.add_argument(
        "--config", type=str, default=None,
        help="Path to config.yaml"
    )
    parser.add_argument(
        "--threshold", type=float, default=None,
        help="Oil probability threshold (0-1). Default: from config"
    )
    parser.add_argument(
        "--output", type=str, default=None,
        help="Path to save JSON results. Default: results/<image_name>_result.json"
    )
    parser.add_argument(
        "--visualize", action="store_true",
        help="Generate visualization"
    )
    parser.add_argument(
        "--mock", action="store_true",
        help="Return mock result (for testing without model)"
    )

    args = parser.parse_args()

    # Validate input
    if not os.path.exists(args.image):
        print(f"[ERROR] Image not found: {args.image}")
        sys.exit(1)

    # Run detection
    if args.mock:
        from inference.api_interface import detect_oil_mock
        result = detect_oil_mock(args.image)
        print("[INFO] Using MOCK result (no model inference)")
    else:
        from inference.api_interface import detect_oil
        print(f"[INFO] Processing: {args.image}")
        result = detect_oil(
            image_path=args.image,
            checkpoint_path=args.checkpoint,
            config_path=args.config,
            threshold=args.threshold,
        )

    # Determine output path
    if args.output:
        output_path = args.output
    else:
        results_dir = PROJECT_ROOT / "results"
        results_dir.mkdir(parents=True, exist_ok=True)
        image_name = Path(args.image).stem
        output_path = str(results_dir / f"{image_name}_result.json")

    # Save result
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2, default=str)
    print(f"[INFO] Results saved to {output_path}")

    # Print summary
    print("\n" + "=" * 50)
    print("  DETECTION SUMMARY")
    print("=" * 50)
    print(f"  Spill detected: {result['spill_detected']}")
    print(f"  Confidence:     {result['confidence']:.2%}")
    print(f"  Candidates:     {len(result.get('candidates', []))}")

    if result.get("spill"):
        spill = result["spill"]
        if spill.get("area_km2") is not None:
            print(f"  Area:           {spill['area_km2']:.2f} km²")
        centroid = spill.get("centroid", {})
        if "latitude" in centroid:
            print(f"  Centroid:       ({centroid['latitude']:.4f}, {centroid['longitude']:.4f})")
        georef = result.get("metadata", {}).get("georeferenced", False)
        print(f"  Georeferenced:  {georef}")

    print(f"  Processing:     {result.get('processing_time_seconds', 0):.2f}s")
    print("=" * 50)

    # Visualization
    if args.visualize and not args.mock:
        print("\n[INFO] Generating visualization...")
        try:
            import numpy as np
            import torch
            import yaml
            from preprocessing.sar_preprocessing import load_sar_image
            from visualization.visualize import create_visualization
            from features.candidate_features import threshold_probability_map

            image_raw, metadata = load_sar_image(args.image)

            # Load config for preprocessing
            config_path = args.config or str(PROJECT_ROOT / "config.yaml")
            if os.path.exists(config_path):
                with open(config_path) as f:
                    config = yaml.safe_load(f)
            else:
                config = {}

            # Re-run quick inference for the probability map
            from preprocessing.sar_preprocessing import preprocess_sar_image
            preproc_cfg = config.get("preprocessing", {})
            norm_bounds = preproc_cfg.get("norm_bounds", {})
            channel_bounds = [
                (norm_bounds.get("vv_min", -30.0), norm_bounds.get("vv_max", 0.0)),
                (norm_bounds.get("vh_min", -35.0), norm_bounds.get("vh_max", -5.0)),
            ]

            image_pp = preprocess_sar_image(
                image_raw,
                normalization=preproc_cfg.get("normalization", "minmax"),
                channel_bounds=channel_bounds,
            )

            from inference.api_interface import _get_device, _load_model, _tile_and_predict
            device = _get_device()
            model = _load_model(
                args.checkpoint or str(PROJECT_ROOT / "checkpoints" / "best_model.pth"),
                config, device,
            )
            prob_map = _tile_and_predict(model, image_pp, device)

            threshold = args.threshold or config.get("inference", {}).get("default_threshold", 0.5)
            binary_pred = threshold_probability_map(prob_map, threshold)

            vv = image_raw[0]
            vh = image_raw[1] if image_raw.shape[0] > 1 else image_raw[0]

            vis_dir = str(PROJECT_ROOT / "results" / "visualizations")
            vis_path = os.path.join(vis_dir, f"{Path(args.image).stem}_detection.png")

            create_visualization(
                vv=vv, vh=vh,
                ground_truth=None,
                prob_map=prob_map,
                binary_pred=binary_pred,
                candidates=result.get("candidates"),
                title=f"MarineTrace Detection — {Path(args.image).name}",
                output_path=vis_path,
            )
        except Exception as e:
            print(f"[WARNING] Visualization failed: {e}")


if __name__ == "__main__":
    main()
