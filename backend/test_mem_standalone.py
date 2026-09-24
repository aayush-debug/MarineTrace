import asyncio
import gc
import psutil
import time
import torch
from concurrent.futures import ThreadPoolExecutor

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ml"))
from inference.api_interface import detect_oil

def get_mem():
    gc.collect()
    return psutil.Process().memory_info().rss / 1024 / 1024

async def test_to_thread():
    print(f"Start to_thread: {get_mem():.2f} MiB")
    img_path = str(Path(__file__).resolve().parent.parent / "ml/data/sample_s1.tif")
    await asyncio.to_thread(detect_oil, img_path)
    print(f"After to_thread: {get_mem():.2f} MiB")

async def test_local_executor():
    print(f"Start local_executor: {get_mem():.2f} MiB")
    img_path = str(Path(__file__).resolve().parent.parent / "ml/data/sample_s1.tif")
    with ThreadPoolExecutor(max_workers=1) as executor:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(executor, detect_oil, img_path)
    print(f"After local_executor: {get_mem():.2f} MiB")

global_executor = ThreadPoolExecutor(max_workers=1)
async def test_global_executor():
    print(f"Start global_executor: {get_mem():.2f} MiB")
    img_path = str(Path(__file__).resolve().parent.parent / "ml/data/sample_s1.tif")
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(global_executor, detect_oil, img_path)
    print(f"After global_executor: {get_mem():.2f} MiB")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("mode")
    args = parser.parse_args()
    
    if args.mode == "tothread":
        asyncio.run(test_to_thread())
    elif args.mode == "local":
        asyncio.run(test_local_executor())
    elif args.mode == "global":
        asyncio.run(test_global_executor())
    elif args.mode == "sync":
        print(f"Start sync: {get_mem():.2f} MiB")
        img_path = str(Path(__file__).resolve().parent.parent / "ml/data/sample_s1.tif")
        detect_oil(img_path)
        print(f"After sync: {get_mem():.2f} MiB")
