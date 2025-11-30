# Bulk Upload Feature - User Guide

## Overview
The Bulk Upload feature allows you to process multiple currency denomination calculations at once by uploading a CSV file. This is perfect for batch processing, data migration, and automated workflows.

## Getting Started

### 1. Access the Feature
- Open the Currency Denomination Distributor application
- Click on **"Bulk Upload"** in the left navigation sidebar
- The upload icon (⬆️) indicates the Bulk Upload section

### 2. Download the Template (Recommended)
Before creating your own CSV file, download the sample template:

1. Click the green **"Download Template"** button at the top-right
2. A file named `bulk_upload_template.csv` will be downloaded
3. Open it in Excel, Google Sheets, or any spreadsheet application
4. Use it as a reference or modify it with your own data

## CSV File Format

### Required Columns
Your CSV file MUST contain:

- **amount** - The monetary amount to calculate (numbers only)

### Optional Columns
- **currency** - 3-letter currency code (INR, USD, EUR, GBP)
  - **Smart Default**: If not provided, automatically uses currency based on your language:
    - English → USD
    - Hindi → INR
    - Spanish, French, German → EUR
  - **Case-Insensitive**: `USD`, `usd`, `Usd` all work
- **optimization_mode** - How to optimize the breakdown:
  - `greedy` - Minimize total denominations (default if not provided)
  - `balanced` - Balance between notes and coins
  - `minimize_large` - Minimize large denominations
  - `minimize_small` - Minimize small denominations
  - **Case-Insensitive**: `GREEDY`, `greedy`, `Greedy` all work

### Example CSV Structure
```csv
amount,currency,optimization_mode
50000,INR,greedy
1000.50,usd,Balanced
5000,,minimize_large
250000
999.99,GBP,GREEDY
```

**Note**: Rows 3-4 show smart defaults:
- Row 3: No currency (uses your language default)
- Row 4: No currency or optimization (uses both defaults)

### File Requirements
✅ **Format**: CSV (Comma-Separated Values)  
✅ **Encoding**: UTF-8 recommended  
✅ **First Row**: Must be column headers  
✅ **File Size**: Maximum 10 MB  
✅ **Extension**: Must be `.csv`

## Uploading Your File

### Method 1: Drag and Drop
1. Prepare your CSV file
2. Drag the file from your file explorer
3. Drop it onto the dashed upload area
4. The file name and size will appear when selected

### Method 2: File Browser
1. Click **"Select File"** button in the upload area
2. Browse your computer for the CSV file
3. Click "Open" to select the file
4. The file name and size will appear

### Processing Options
Before uploading, you can choose:

- ☑️ **Save to History** - Stores successful calculations in your history (recommended)
- ☐ **Save to History** - Only processes without saving (useful for testing)

### Start Processing
1. Ensure your file is selected
2. Check the "Save to History" option if desired
3. Click the blue **"Upload & Process"** button
4. Wait for processing to complete (progress indicator will show)

## Understanding Results

### Summary Statistics
After processing, you'll see 4 cards showing:

1. **Total Rows** - Number of rows processed (excluding header)
2. **Successful** - Count of successfully calculated rows (green)
3. **Failed** - Count of rows with errors (red)
4. **Processing Time** - Time taken in seconds

### Results Table
The detailed table shows each row with:

- **Row #** - Row number from your CSV (starts at 2 since row 1 is headers)
- **Status** - Success ✓ (green) or Error ✗ (red)
- **Amount** - The amount from your CSV
- **Currency** - The currency code
- **Denominations** - For successful rows: count of notes and coins
- **Details** - For successful rows: total denominations; For failed rows: error message

### Success Row Example
```
Row # | Status  | Amount  | Currency | Denominations      | Details
2     | Success | 50000   | INR      | 25 Notes, 0 Coins  | Total: 25
```

### Error Row Example
```
Row # | Status | Amount   | Currency | Denominations | Details
8     | Error  | invalid  | INR      | —             | Invalid amount format: invalid
```

## Common Error Messages

### File Upload Errors
- **"Invalid file type"** - Your file is not a CSV. Save as `.csv` format
- **"File is too large"** - File exceeds 10 MB. Split into smaller files
- **"File is empty"** - The file has no content. Add data rows
- **"CSV must contain required column: amount"** - Missing amount header

### Processing Errors (Per Row)
- **"Amount is required"** - Missing amount column value
- **"Invalid amount format: X"** - Amount contains non-numeric characters
- **"Amount must be positive"** - Amount is zero or negative
- **"Currency must be 3-letter code, got: X"** - Currency is provided but not exactly 3 characters

**Note**: Missing currency or optimization mode are NOT errors - they use smart defaults!

## Exporting Results

After processing, you can export your results in multiple formats:

### 1. Export as CSV
- Click **"Export CSV"** button (green)
- Downloads a CSV file with all results
- Includes success/error status for each row
- Can be opened in Excel or Google Sheets
- Filename: `bulk_upload_results_YYYY-MM-DD.csv`

### 2. Export as JSON
- Click **"Export JSON"** button (blue)
- Downloads complete results in JSON format
- Includes all metadata and detailed breakdowns
- Useful for developers and data integration
- Filename: `bulk_upload_results_YYYY-MM-DD.json`

### 3. Copy to Clipboard
- Click **"Copy Results"** button (purple)
- Copies formatted text summary to clipboard
- Shows success/error count and row details
- Paste into emails, documents, or notes
- Button shows "Copied!" confirmation for 3 seconds

## Processing Another File

After viewing results:

1. Click **"Upload Another File"** button (gray)
2. The page resets to the upload screen
3. Select and upload a new CSV file
4. Previous results are cleared

## Tips & Best Practices

### ✅ Do's
- **Test with small files first** (5-10 rows) to verify format
- **Use UTF-8 encoding** when saving CSV files
- **Include column headers** in the first row
- **Use exact column names**: `amount`, `currency`, `optimization_mode`
- **Verify data** before uploading large files
- **Download the template** if unsure about format
- **Check error messages** to fix invalid rows

### ❌ Don'ts
- **Don't use Excel formats** (.xlsx, .xls) - use CSV only
- **Don't include empty rows** in the middle of your data
- **Don't use currency symbols** in the amount column (use numbers only)
- **Don't exceed 10 MB** file size
- **Don't use semicolons** - CSV must use commas as separators
- **Don't skip the header row** - it's required for column identification

## Troubleshooting

### Problem: "File upload failed"
**Solution**: Check your internet connection and ensure the backend server is running

### Problem: All rows show errors
**Solution**: 
1. Download the template
2. Compare your CSV structure
3. Ensure column names match exactly: `amount`, `currency`
4. Check for extra spaces in column headers

### Problem: Some rows fail with "Invalid amount"
**Solution**:
1. Remove currency symbols (₹, $, €, £)
2. Remove commas from numbers (use 50000 not 50,000)
3. Use decimal point (.) not comma for decimals
4. Ensure no text in amount column

### Problem: "Currency must be 3-letter code"
**Solution**:
1. Use: INR, USD, EUR, GBP (uppercase)
2. Not: Rupee, Dollar, rupees, usd
3. Exactly 3 characters required

### Problem: Results take too long
**Solution**:
- File may be very large (thousands of rows)
- Split into smaller batches (500-1000 rows per file)
- Processing time is shown in results summary

## Performance Guide

### Processing Speed
- **Small files** (1-100 rows): < 1 second
- **Medium files** (100-1000 rows): 1-10 seconds
- **Large files** (1000-5000 rows): 10-50 seconds
- **Very large files** (5000+ rows): 50+ seconds

### File Size Recommendations
- **Optimal**: 100-500 rows per file
- **Maximum**: 10 MB (approximately 10,000-50,000 rows)
- **Best practice**: Split large datasets into multiple files

## Integration with History

### When "Save to History" is Enabled (Default)
- ✅ All successful calculations are saved to your history
- ✅ You can view them in the **History** tab
- ✅ Source is marked as "bulk_upload"
- ✅ Full denomination breakdowns are stored
- ✅ Can be exported/printed later

### When "Save to History" is Disabled
- ℹ️ Results are shown but not saved permanently
- ℹ️ Useful for testing or preview
- ℹ️ Faster processing (no database writes)
- ℹ️ Results disappear when you upload another file

## Advanced Usage

### Automation
The bulk upload feature can be integrated with automated workflows:

1. **Scheduled Jobs**: Generate CSV from your system
2. **API Integration**: Use the backend API directly
3. **Data Migration**: Import historical data
4. **Batch Processing**: Process end-of-day calculations

### API Endpoint
For developers, the backend API endpoint is:

```
POST /api/v1/bulk-upload
Content-Type: multipart/form-data
Parameters: file (CSV), save_to_history (boolean)
```

See `BULK_UPLOAD.md` in the backend package for API documentation.

## Multi-Language Support

The Bulk Upload feature supports all 5 languages:
- 🇬🇧 English
- 🇮🇳 Hindi (हिंदी)
- 🇪🇸 Spanish (Español)
- 🇫🇷 French (Français)
- 🇩🇪 German (Deutsch)

All UI text, error messages, and buttons automatically translate based on your selected language in Settings.

## Frequently Asked Questions

**Q: Can I upload Excel files?**  
A: No, only CSV format is supported. Save your Excel file as CSV first.

**Q: What's the maximum file size?**  
A: 10 MB maximum. This typically supports tens of thousands of rows.

**Q: Can I process the same file multiple times?**  
A: Yes, you can upload the same file as many times as needed.

**Q: Will duplicate calculations appear in history?**  
A: Yes, if "Save to History" is enabled, each upload creates new history entries.

**Q: Can I edit the CSV after upload?**  
A: No, you need to download, edit, and re-upload the file.

**Q: Are partial results saved if some rows fail?**  
A: Yes, successful rows are processed and saved (if enabled) even if some rows fail.

**Q: Can I cancel processing?**  
A: No, once started, processing completes for all rows.

**Q: What happens to failed rows?**  
A: They are shown in the results table with error messages but not saved to history.

## Support & Feedback

For issues or questions:
1. Check this user guide
2. Review error messages carefully
3. Download and compare with the template
4. Check the backend documentation
5. Verify file format and encoding

## Version Information

- **Feature Version**: 1.0.0
- **Supported Currencies**: INR, USD, EUR, GBP
- **Supported Optimization Modes**: greedy, balanced, minimize_large, minimize_small
- **Max File Size**: 10 MB
- **Languages**: 5 (EN, HI, ES, FR, DE)
