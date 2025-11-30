"""Test OCR processing with actual files"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.ocr_processor import get_ocr_processor
from PIL import Image, ImageDraw, ImageFont
import io

print("=" * 60)
print("Testing OCR Processor")
print("=" * 60)

# Get OCR processor
processor = get_ocr_processor()

# Test 1: Create a simple test image with text
print("\n1. Creating test image with bulk data...")
img = Image.new('RGB', (800, 400), color='white')
draw = ImageDraw.Draw(img)

# Try to use a default font
try:
    font = ImageFont.truetype("arial.ttf", 24)
except:
    font = ImageFont.load_default()

# Draw text
text_lines = [
    "Amount, Currency, Mode",
    "1000, INR, greedy",
    "250.50, USD, balanced",
    "500, EUR, minimize_large"
]

y = 50
for line in text_lines:
    draw.text((50, y), line, fill='black', font=font)
    y += 60

# Save image to bytes
img_bytes = io.BytesIO()
img.save(img_bytes, format='PNG')
img_bytes.seek(0)

print("   [OK] Test image created")

# Test 2: Process the image with OCR
print("\n2. Processing image with OCR...")
try:
    rows = processor.process_file(img_bytes.getvalue(), "test_image.png")
    print(f"   [OK] Extracted {len(rows)} rows")
    
    if rows:
        print("\n   Extracted data:")
        for row in rows:
            print(f"     Row {row['row_number']}: {row['amount']} {row['currency']} {row['optimization_mode']}")
    else:
        print("   [WARNING] No rows extracted")
        
except Exception as e:
    print(f"   [FAIL] OCR processing failed: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Create a simple PDF
print("\n3. Testing PDF processing...")
try:
    import fitz  # PyMuPDF
    
    # Create a simple PDF with text
    pdf = fitz.open()
    page = pdf.new_page(width=595, height=842)  # A4 size
    
    # Insert text
    text = """Amount, Currency, Mode
1000, INR, greedy
250.50, USD, balanced
500, EUR, minimize_large"""
    
    page.insert_text((50, 50), text, fontsize=14)
    
    # Save to bytes
    pdf_bytes = pdf.write()
    pdf.close()
    
    print("   [OK] Test PDF created")
    
    # Process PDF
    rows = processor.process_file(pdf_bytes, "test.pdf")
    print(f"   [OK] Extracted {len(rows)} rows from PDF")
    
    if rows:
        print("\n   Extracted data:")
        for row in rows:
            print(f"     Row {row['row_number']}: {row['amount']} {row['currency']} {row['optimization_mode']}")
    else:
        print("   [WARNING] No rows extracted from PDF")
        
except Exception as e:
    print(f"   [FAIL] PDF processing failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("OCR Test Complete")
print("=" * 60)
