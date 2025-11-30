#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix complete-codebase.html corruption using byte sequences"""

import os
import codecs

FILE_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'pages', 'complete-codebase.html')

# Define corruptions as UTF-8 byte sequences to avoid file corruption
# Format: (corrupted_bytes, correct_unicode_char)
FIXES = [
    (b'\xc3\xa2\xc2\x86\xc2\x92', '\u2192'),  # → right arrow
    (b'\xc3\xa2\xc2\x86\xc2\x93', '\u2193'),  # ↓ down arrow
    (b'\xc3\xa2\xc2\x94\xc2\x8c', '\u250C'),  # ┌ box top-left
    (b'\xc3\xa2\xc2\x94\xc2\x80', '\u2500'),  # ─ box horizontal
    (b'\xc3\xa2\xc2\x94\xc2\x90', '\u2510'),  # ┐ box top-right
    (b'\xc3\xa2\xc2\x94\xc2\x82', '\u2502'),  # │ box vertical
    (b'\xc3\xa2\xc2\x94\xc2\xa4', '\u251C'),  # ├ box mid-left
    (b'\xc3\xa2\xc2\x94\xc2\x9c', '\u251C'),  # ├ box mid-left (alt)
    (b'\xc3\xa2\xc2\x94\xc2\x94', '\u2514'),  # └ box bottom-left
    (b'\xc3\xa2\xc2\x94\xc2\x98', '\u2518'),  # ┘ box bottom-right
    (b'\xc3\xa2\xc2\x9c\xc2\x93', '\u2713'),  # ✓ checkmark
    (b'\xc3\xa2\xc2\x9c\xc2\x97', '\u2717'),  # ✗ x mark
]

def main():
    print('╔════════════════════════════════════════════════════╗')
    print('║  Fixing complete-codebase.html Corruption         ║')
    print('╚════════════════════════════════════════════════════╝\n')
    
    try:
        # Read file as bytes
        with open(FILE_PATH, 'rb') as f:
            content_bytes = f.read()
        
        original_bytes = content_bytes
        total_replacements = 0
        
        # Apply all fixes
        for corrupted_bytes, correct_char in FIXES:
            count = content_bytes.count(corrupted_bytes)
            if count > 0:
                correct_bytes = correct_char.encode('utf-8')
                content_bytes = content_bytes.replace(corrupted_bytes, correct_bytes)
                total_replacements += count
                corrupted_str = corrupted_bytes.decode('utf-8', errors='replace')
                print(f"✓ Replaced '{corrupted_str}' → '{correct_char}' ({count} times)")
        
        if content_bytes != original_bytes:
            # Write fixed content
            with open(FILE_PATH, 'wb') as f:
                f.write(content_bytes)
            
            print('\n╔════════════════════════════════════════════════════╗')
            print('║                Summary Report                      ║')
            print('╚════════════════════════════════════════════════════╝\n')
            
            print(f'Total replacements: {total_replacements}')
            print('\n✅ complete-codebase.html has been fixed!')
        else:
            print('✨ No corruption found in complete-codebase.html')
        
        return 0
        
    except Exception as e:
        print(f'❌ Error: {e}')
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    exit(main())
