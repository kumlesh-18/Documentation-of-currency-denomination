# Quick Start - Bulk CSV Upload

## 🚀 Get Started in 3 Steps

### Step 1: Download Template
1. Open the app and click **"Bulk Upload"** in the sidebar
2. Click the green **"Download Template"** button
3. Open `bulk_upload_template.csv` in Excel or any spreadsheet app

### Step 2: Add Your Data
Edit the CSV file with your amounts:

```csv
amount,currency,optimization_mode
50000,INR,greedy
1000.50,USD,balanced
5000,EUR,minimize_large
```

**Required columns:**
- `amount` - The money amount (numbers only)
- `currency` - Currency code (INR, USD, EUR, GBP)

**Optional column:**
- `optimization_mode` - greedy, balanced, minimize_large, or minimize_small

### Step 3: Upload & Process
1. **Drag and drop** your CSV file onto the upload area, OR
2. Click **"Select File"** and browse to your CSV
3. Check **"Save to History"** if you want to keep results
4. Click **"Upload & Process"**
5. View your results!

---

## 📊 Understanding Results

### Summary Cards
After processing, you'll see 4 cards:

- **Total Rows**: How many calculations were processed
- **Successful**: How many worked (green ✓)
- **Failed**: How many had errors (red ✗)
- **Processing Time**: How long it took

### Results Table
Each row shows:
- **Row #**: Row number from your CSV
- **Status**: Success or Error
- **Amount**: The amount you entered
- **Currency**: The currency code
- **Denominations**: Count of notes and coins
- **Details**: Total denominations or error message

---

## 📥 Export Your Results

After processing, you can:

### Export as CSV
- Click **"Export CSV"** (green button)
- Opens in Excel/Google Sheets
- Filename: `bulk_upload_results_2025-11-23.csv`

### Export as JSON
- Click **"Export JSON"** (blue button)
- For developers and data integration
- Filename: `bulk_upload_results_2025-11-23.json`

### Copy to Clipboard
- Click **"Copy Results"** (purple button)
- Copies formatted summary
- Paste into emails or documents

---

## ⚠️ Common Mistakes

### ❌ Wrong File Format
**Problem**: Uploading `.xlsx` or `.xls` files  
**Solution**: Save as CSV format in Excel

### ❌ Missing Headers
**Problem**: No column names in first row  
**Solution**: First row must be: `amount,currency,optimization_mode`

### ❌ Invalid Amount
**Problem**: Using currency symbols like ₹, $, €  
**Solution**: Use numbers only: `50000` not `₹50,000`

### ❌ Wrong Currency Code
**Problem**: Using full names like "Rupees"  
**Solution**: Use 3-letter codes: `INR` `USD` `EUR` `GBP`

---

## 🎯 Tips for Success

### ✅ Best Practices
1. **Test with 5-10 rows first** before uploading large files
2. **Download the template** to see the exact format
3. **Use UTF-8 encoding** when saving CSV files
4. **Don't use commas** in numbers (50000 not 50,000)
5. **Remove empty rows** from your CSV
6. **Check errors carefully** if some rows fail

### 📏 File Size Limits
- **Maximum**: 10 MB
- **Recommended**: 100-500 rows per file
- **Large files**: May take 10-50 seconds to process

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| File won't upload | Check file is `.csv` format and under 10 MB |
| All rows fail | Compare your CSV with the downloaded template |
| Some rows fail | Check error messages in Details column |
| Slow processing | File may be large - split into smaller files |
| Can't find results | Results disappear if you upload another file |

---

## 🌐 Language Support

The bulk upload feature works in all 5 languages:
- 🇬🇧 English
- 🇮🇳 हिंदी (Hindi)
- 🇪🇸 Español (Spanish)
- 🇫🇷 Français (French)
- 🇩🇪 Deutsch (German)

Change language in **Settings** - all text updates automatically!

---

## 📖 Need More Help?

See the full documentation:
- **User Guide**: `BULK_UPLOAD_USER_GUIDE.md` (comprehensive guide)
- **API Docs**: `packages/local-backend/BULK_UPLOAD.md` (for developers)
- **Implementation**: `BULK_UPLOAD_IMPLEMENTATION.md` (technical details)

---

## ✨ Example Workflow

### Scenario: Process 100 transactions
1. Export your transactions from your system as CSV
2. Make sure columns are: `amount`, `currency`
3. Upload to Bulk Upload page
4. Review results (should complete in 1-2 seconds)
5. Export results as CSV for record-keeping
6. Failed rows? Fix errors and re-upload just those rows

### Scenario: Testing different optimization modes
1. Download template
2. Copy same amount 4 times with different modes:
   - Row 1: `50000,INR,greedy`
   - Row 2: `50000,INR,balanced`
   - Row 3: `50000,INR,minimize_large`
   - Row 4: `50000,INR,minimize_small`
3. Upload and compare denomination counts
4. Choose the mode that works best for you

---

**Ready to try it?** Click **Bulk Upload** in the sidebar and start processing!

---

**Version**: 1.0.0 | **Last Updated**: November 23, 2025
