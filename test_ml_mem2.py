import sys, os, time, resource
import torch
torch.set_num_threads(1)

def print_mem(label):
    mem = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / (1024*1024)
    print(f"{label}: {mem:.2f} MB")

print_mem("Start")
import ml.inference.api_interface as api
import numpy as np
import gc

def patched_detect_oil(*args, **kwargs):
    print_mem("  Inside detect_oil: Start")
    image_raw, metadata = api.load_sar_image(args[0])
    print_mem("  Inside detect_oil: After load_sar_image")
    
    #... mock some of it to trace memory
    
api.detect_oil = patched_detect_oil

print_mem("After import")
api.detect_oil("ml/data/sample_s1.tif")
print_mem("After detect_oil")
