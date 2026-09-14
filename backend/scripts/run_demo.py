#!/usr/bin/env python3
"""
MarineTrace — CLI Demonstration Runner Wrapper
Delegates to the root run_demo.py script.
"""
import sys
from pathlib import Path

# Locate root run_demo.py
root_demo = Path(__file__).resolve().parent.parent.parent / "run_demo.py"
if not root_demo.exists():
    root_demo = Path("/app/run_demo.py")

if root_demo.exists():
    import runpy
    sys.argv[0] = str(root_demo)
    runpy.run_path(str(root_demo), run_name="__main__")
else:
    print(f"[ERROR] Could not locate run_demo.py at {root_demo}")
    sys.exit(1)
