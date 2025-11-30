#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix complete-codebase.html corruption
Handles arrows, box-drawing, checkmarks, and other symbols
"""

import os
import re

FILE_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'pages', 'complete-codebase.html')

# Corruption fixes - using escape sequences to avoid file corruption
FIXES = [
    # Arrows
    ('â†'', '→'),
    ('â†"', '↓'),
    
    # Box-drawing characters  
    ('â"Œ', '┌'),
    ('â"€', '─'),
    ('â"', '┐'),
    ('â"‚', '│'),
    ('â"¤', '├'),
    ('â"œ', '├'),
    ('â""', '└'),
    ('â"˜', '┘'),
    
    # Checkmarks
    ('âœ"', '✓'),
    ('âœ—', '✗'),
]

def main():
    print('╔════════════════════════════════════════════════════╗')
    print('║  Fixing complete-codebase.html Corruption         ║')
    print('╚════════════════════════════════════════════════════╝\n')
    
    try:
        # Read file
        with open(FILE_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        total_replacements = 0
        replacement_details = []
        
        # Apply all fixes
        for corrupted, correct in FIXES:
            count = content.count(corrupted)
            if count > 0:
                content = content.replace(corrupted, correct)
                total_replacements += count
                replacement_details.append((corrupted, correct, count))
                print(f"✓ Replaced '{corrupted}' → '{correct}' ({count} times)")
        
        if content != original_content:
            # Write fixed content
            with open(FILE_PATH, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            
            print('\n╔════════════════════════════════════════════════════╗')
            print('║                Summary Report                      ║')
            print('╚════════════════════════════════════════════════════╝\n')
            
            print(f'Total replacements: {total_replacements}')
            print(f'Unique corruption types fixed: {len(replacement_details)}\n')
            
            print('Replacement breakdown:')
            for corrupted, correct, count in replacement_details:
                print(f'  {corrupted} → {correct}: {count}')
            
            print('\n✅ complete-codebase.html has been fixed!')
        else:
            print('✨ No corruption found in complete-codebase.html')
        
        return 0
        
    except Exception as e:
        print(f'❌ Error: {e}')
        return 1

if __name__ == '__main__':
    exit(main())
