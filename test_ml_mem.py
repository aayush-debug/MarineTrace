import sys, os, time, resource

def print_mem(label):
    mem = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / (1024*1024)
    print(f"{label}: {mem:.2f} MB")

print_mem("Start")

from ml.inference.api_interface import detect_oil
print_mem("After import")

# Optionally limit threads
if len(sys.argv) > 1 and sys.argv[1] == "limit":
    import torch
    torch.set_num_threads(1)
    print_mem("After torch.set_num_threads(1)")

res = detect_oil("ml/data/sample_s1.tif")
print_mem("After detect_oil")
