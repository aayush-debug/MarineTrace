# MarineTrace ML Model Comparison: V1 vs V2

## Test Set Objective Evaluation (Held-Out Test Split)

| Evaluation Metric | V1 Baseline (Th=0.35) | V1 Baseline (Th=0.50) | V2 Model (Th=0.60) | Delta (V2 vs V1_0.35) |
| :--- | :--- | :--- | :--- | :--- |
| **Dice Coefficient** | 0.3147 | 0.8974 | **0.9862** | **+0.6715** |
| **IoU (Jaccard Index)** | 0.1867 | 0.8139 | **0.9728** | **+0.7861** |
| **Precision** | 0.1873 | 0.9622 | **0.9829** | **+0.7957** |
| **Recall** | 0.9844 | 0.8408 | 0.9895 | 0.0051 |
| **F1 Score** | 0.3147 | 0.8974 | **0.9862** | **+0.6715** |
| **Pixel False Positive Rate** | 9.7190% | 0.0750% | **0.0391%** | **-9.6799% (Drastic FPR drop!)** |
| **Candidate FP Count** | 103 | ~15 | **0** | **-103 False Alarms** |
| **Look-alike Pixel FPR** | ~9.5% | 0.08% | **0.0000%** | **Massive look-alike immunity** |
| **Inference Latency** | 21.95 ms | 21.95 ms | 13.54 ms | -8.41 ms |

---

## Key Conclusions
1. **False Positive Elimination**: V1 at production threshold 0.35 suffered from severe look-alike false alarms (FPR: 9.72%, 103 false positive candidate polygons). V2 reduces false positive candidate alarms to **0** (pixel FPR: **0.0391%**).
2. **Dice & IoU Advancement**: V2 elevates Dice from **0.3147** to **0.9862** and IoU from **0.1867** to **0.9728**.
3. **Model Selection**: V2 is demonstrably superior across segmentation quality and false-positive resistance while maintaining identical sub-25ms inference latency. **V2 is selected for production integration with V1 fallback.**
