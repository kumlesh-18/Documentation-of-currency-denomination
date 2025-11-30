"""Test bulk upload API with PDF and Image"""
import requests
from PIL import Image, ImageDraw, ImageFont
import io
import fitz

API_URL = "http://127.0.0.1:8001/api/v1/bulk-upload"

print("=" * 60)
print("Testing Bulk Upload API with OCR Files")
print("=" * 60)

# Test 1: Create and upload PNG image
print("\n1. Testing PNG Image Upload...")
img = Image.new('RGB', (800, 400), color='white')
draw = ImageDraw.Draw(img)

try:
    font = ImageFont.truetype("arial.ttf", 24)
except:
    font = ImageFont.load_default()

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

# Save image
img_bytes = io.BytesIO()
img.save(img_bytes, format='PNG')
img_bytes.seek(0)

# Upload
try:
    files = {'file': ('test_image.png', img_bytes, 'image/png')}
    params = {'save_to_history': False}
    response = requests.post(API_URL, files=files, params=params, timeout=30)
    
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   [OK] Total rows: {data['total_rows']}, Success: {data['successful']}, Failed: {data['failed']}")
        if data['results']:
            for result in data['results'][:3]:  # Show first 3
                if result['status'] == 'success':
                    print(f"     ✓ Row {result['row_number']}: {result['amount']} {result['currency']}")
                else:
                    print(f"     ✗ Row {result['row_number']}: {result.get('error', 'Unknown error')}")
    else:
        print(f"   [FAIL] {response.text}")
except Exception as e:
    print(f"   [ERROR] {e}")

# Test 2: Create and upload PDF
print("\n2. Testing PDF Upload...")
pdf = fitz.open()
page = pdf.new_page(width=595, height=842)

text = """Amount, Currency, Mode
1500, GBP, greedy
750, JPY, balanced
2000, CAD, minimize_large"""

page.insert_text((50, 50), text, fontsize=14)

pdf_bytes = pdf.write()
pdf.close()

# Upload
try:
    files = {'file': ('test.pdf', pdf_bytes, 'application/pdf')}
    params = {'save_to_history': False}
    response = requests.post(API_URL, files=files, params=params, timeout=30)
    
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   [OK] Total rows: {data['total_rows']}, Success: {data['successful']}, Failed: {data['failed']}")
        if data['results']:
            for result in data['results'][:3]:
                if result['status'] == 'success':
                    print(f"     ✓ Row {result['row_number']}: {result['amount']} {result['currency']}")
                else:
                    print(f"     ✗ Row {result['row_number']}: {result.get('error', 'Unknown error')}")
    else:
        print(f"   [FAIL] {response.text}")
except Exception as e:
    print(f"   [ERROR] {e}")

print("\n" + "=" * 60)
print("API Test Complete")
print("=" * 60)
