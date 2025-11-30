# Simple literal string replacement script
import sys

file_path = r"f:\documentation-website\public\pages\complete-codebase.html"

print("Reading file...")
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

original = content
replacements = 0

# Arrow down
if "â†"" in content:
    count = content.count("â†"")
    content = content.replace("â†"", "↓")
    replacements += count
    print(f"Replaced arrow down: {count}")

# Arrow right
if "â†'" in content:
    count = content.count("â†'")
    content = content.replace("â†'", "→")
    replacements += count
    print(f"Replaced arrow right: {count}")

# Box top-left
if "â"Œ" in content:
    count = content.count("â"Œ")
    content = content.replace("â"Œ", "┌")
    replacements += count
    print(f"Replaced box top-left: {count}")

# Box horizontal
if "â"€" in content:
    count = content.count("â"€")
    content = content.replace("â"€", "─")
    replacements += count
    print(f"Replaced box horizontal: {count}")

# Box vertical
if "â"‚" in content:
    count = content.count("â"‚")
    content = content.replace("â"‚", "│")
    replacements += count
    print(f"Replaced box vertical: {count}")

# Box mid-left
if "â"œ" in content:
    count = content.count("â"œ")
    content = content.replace("â"œ", "├")
    replacements += count
    print(f"Replaced box mid-left: {count}")

# Box bottom-left
if "â""" in content:
    count = content.count("â""")
    content = content.replace("â""", "└")
    replacements += count
    print(f"Replaced box bottom-left: {count}")

# Checkmark
if "âœ"" in content:
    count = content.count("âœ"")
    content = content.replace("âœ"", "✓")
    replacements += count
    print(f"Replaced checkmark: {count}")

# X mark
if "âœ—" in content:
    count = content.count("âœ—")
    content = content.replace("âœ—", "✗")
    replacements += count
    print(f"Replaced x-mark: {count}")

if content != original:
    print(f"\nWriting fixed content... ({replacements} total replacements)")
    with open(file_path, "w", encoding="utf-8", newline='') as f:
        f.write(content)
    print("✅ File fixed successfully!")
else:
    print("No corruptions found.")
