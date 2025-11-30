"""Check OCR dependencies"""
import sys

print("Checking OCR Dependencies...")
print("=" * 50)

# Check pytesseract
try:
    import pytesseract
    from PIL import Image
    print("[OK] pytesseract installed")
    print(f"    Tesseract command: {pytesseract.pytesseract.tesseract_cmd}")
    try:
        version = pytesseract.get_tesseract_version()
        print(f"    Version: {version}")
    except Exception as e:
        print(f"    [WARNING] Cannot get version: {e}")
except ImportError as e:
    print(f"[FAIL] pytesseract: {e}")

# Check PyMuPDF
try:
    import fitz
    print(f"[OK] PyMuPDF installed (version {fitz.__version__})")
except ImportError as e:
    print(f"[FAIL] PyMuPDF: {e}")

# Check pdf2image
try:
    from pdf2image import convert_from_bytes
    print("[OK] pdf2image installed")
except ImportError as e:
    print(f"[FAIL] pdf2image: {e}")

# Check python-docx
try:
    import docx
    print("[OK] python-docx installed")
except ImportError as e:
    print(f"[FAIL] python-docx: {e}")

# Check Pillow
try:
    from PIL import Image
    print(f"[OK] Pillow installed")
except ImportError as e:
    print(f"[FAIL] Pillow: {e}")

print("=" * 50)

# Check if OCR processor can be imported
try:
    from app.services.ocr_processor import get_ocr_processor
    processor = get_ocr_processor()
    deps = processor.check_dependencies()
    
    print("\nOCR Processor Status:")
    print(f"  Tesseract: {'OK' if deps['tesseract'] else 'MISSING'}")
    print(f"  PyMuPDF:   {'OK' if deps['pymupdf'] else 'MISSING'}")
    print(f"  pdf2image: {'OK' if deps['pdf2image'] else 'MISSING'}")
    print(f"  python-docx: {'OK' if deps['docx'] else 'MISSING'}")
except Exception as e:
    print(f"\n[ERROR] Cannot load OCR processor: {e}")
    import traceback
    traceback.print_exc()
