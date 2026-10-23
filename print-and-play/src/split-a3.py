"""ตัดกระดานหน้าเดียว 594 × 420 มม. เป็น A3 แนวตั้ง 2 แผ่น (ซ้าย/ขวา) โดยไม่แปลงเป็นภาพ"""
import copy, sys
from pypdf import PdfReader, PdfWriter

path = sys.argv[1]
src = PdfReader(path).pages[0]
w, h = float(src.mediabox.width), float(src.mediabox.height)
out = PdfWriter()
for x0 in (0, w / 2):
    page = out.add_page(copy.deepcopy(src))
    page.mediabox.lower_left = (x0, 0)
    page.mediabox.upper_right = (x0 + w / 2, h)
    page.cropbox = page.mediabox
with open(path, 'wb') as f:
    out.write(f)
