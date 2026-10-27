"""The public MINEVORA 3.0 URL now redirects to the new 4.0 design.
The maintained browser smoke suite validates desktop, tablet, phone, V3
redirect, root redirect and backwards-compatible legacy account entry.
"""
from pathlib import Path
import runpy
print("Public V3 -> V4: running current smoke tests")
runpy.run_path(str(Path(__file__).with_name("test_website_v4.py")),run_name="__main__")
