import asyncio
import os
import time
import requests
import psutil
from subprocess import Popen

def run():
    print("Starting server...")
    proc = Popen(["venv/bin/uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8085"])
    time.sleep(3)
    p = psutil.Process(proc.pid)
    
    print(f"Idle memory: {p.memory_info().rss / 1024 / 1024:.2f} MiB")
    
    print("Running /detect...")
    t0 = time.time()
    resp = requests.post("http://127.0.0.1:8085/detect", json={"threshold": 0.35})
    t1 = time.time()
    print(f"Detect 1 status: {resp.status_code}, time: {t1-t0:.2f}s")
    
    print(f"Memory after detect 1: {p.memory_info().rss / 1024 / 1024:.2f} MiB")

    print("Running /detect 2...")
    t0 = time.time()
    resp = requests.post("http://127.0.0.1:8085/detect", json={"threshold": 0.35})
    t1 = time.time()
    print(f"Detect 2 status: {resp.status_code}, time: {t1-t0:.2f}s")
    
    print(f"Memory after detect 2: {p.memory_info().rss / 1024 / 1024:.2f} MiB")

    proc.terminate()

if __name__ == "__main__":
    run()
