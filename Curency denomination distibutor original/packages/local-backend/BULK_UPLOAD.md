# Bulk CSV Upload Feature

## Overview
The bulk CSV upload feature allows users to process multiple denomination calculations in a single request by uploading a CSV file. This is useful for:
- Batch processing of multiple amounts
- Automated calculations from spreadsheets
- Migrating existing calculation data
- Testing multiple scenarios

## API Endpoint

### POST `/api/v1/bulk-upload`

Upload a CSV file containing multiple calculation requests.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Parameters:
  - `file`: CSV file (required)
  - `save_to_history`: Boolean (default: true) - Whether to save results to history
  - `language`: String (default: 'en') - Language code for smart currency defaults (en, hi, es, fr, de)

**Response:**
```json
{
  "total_rows": 10,
  "successful": 9,
  "failed": 1,
  "processing_time_seconds": 0.523,
  "saved_to_history": true,
  "results": [
    {
      "row_number": 2,
      "status": "success",
      "amount": "50000",
      "currency": "INR",
      "optimization_mode": "greedy",
      "total_notes": 25,
      "total_coins": 0,
      "total_denominations": 25,
      "breakdowns": [...],
      "calculation_id": 123
    },
    {
      "row_number": 8,
      "status": "error",
      "amount": "invalid",
      "currency": "INR",
      "error": "Invalid amount format: invalid"
    }
  ]
}
```

## CSV Format

### Required Columns
- `amount`: Numeric value (supports decimals and large numbers)
  - **Case-Insensitive Header**: `amount`, `Amount`, `AMOUNT` all work

### Optional Columns
- `currency`: 3-letter currency code (INR, USD, EUR, GBP)
  - **Case-Insensitive Header**: `currency`, `Currency`, `CURRENCY` all work
  - **Case-Insensitive Value**: `USD`, `usd`, `Usd` are all valid
  - **Smart Default**: If not provided, defaults based on your language:
    - English (en) → USD
    - Hindi (hi) → INR
    - Spanish (es) → EUR
    - French (fr) → EUR
    - German (de) → EUR
- `optimization_mode`: One of:
  - **Case-Insensitive Header**: `optimization_mode`, `Optimization_Mode`, `OPTIMIZATION_MODE` all work
  - **Case-Insensitive Value**: `GREEDY`, `greedy`, `Greedy` are all valid
  - `greedy` (default if not provided) - Minimize total denominations
  - `balanced` - Balance between notes and coins
  - `minimize_large` - Minimize large denominations
  - `minimize_small` - Minimize small denominations

### Case-Insensitive Processing
The system is **completely case-insensitive** for:
- ✅ **Column headers**: `Amount`, `AMOUNT`, `amount` all recognized
- ✅ **Currency values**: `USD`, `usd`, `UsD` all valid
- ✅ **Optimization values**: `GREEDY`, `greedy`, `Greedy` all valid

This means you can use ANY casing you prefer!

### Example CSV

```csv
Amount,Currency,Optimization_Mode
50000,INR,greedy
1000.50,usd,Balanced
5000,,minimize_large
250000
999.99,GBP,GREEDY
7500,eur
```

**Alternative valid headers** (all work the same):
```csv
AMOUNT,CURRENCY,OPTIMIZATION_MODE
amount,currency,optimization_mode
Amount,Currency,Optimization_Mode
```

**Note**: Rows demonstrate:
- Row 1: Standard case
- Row 2: Mixed case values
- Row 3: No currency (uses language default), has optimization
- Row 4: Only amount (uses both defaults)
- Row 5: Uppercase optimization
- Row 6: Currency only, lowercase (uses greedy default)

### File Requirements
- **Format**: CSV (Comma-Separated Values)
- **Encoding**: UTF-8 recommended
- **First Row**: Must be headers
- **File Extension**: `.csv`
- **Max Size**: No hard limit, but large files may take longer to process

## Validation

The API validates each row and provides detailed error messages:

### Amount Validation
- Must be present
- Must be a valid number (supports decimals)
- Must be positive (> 0)
- Supports large numbers as strings

### Currency Validation (Optional)
- If provided, must be exactly 3 characters
- If provided, must be a supported currency (INR, USD, EUR, GBP)
- If not provided, defaults based on language parameter
- Case-insensitive (USD, usd, Usd all work)

### Optimization Mode Validation (Optional)
- If provided, must be one of: greedy, balanced, minimize_large, minimize_small
- If not provided, defaults to "greedy"
- If invalid, defaults to "greedy" (no error thrown)
- Case-insensitive (GREEDY, greedy, Greedy all work)

## Error Handling

### Row-Level Errors
Invalid rows are marked as "error" status with specific error messages:
- `"Amount is required"` - Missing amount
- `"Currency must be 3-letter code (e.g., INR, USD), got: X"` - Invalid currency format (only if currency is provided but invalid)
- `"Invalid amount format: X"` - Cannot parse amount
- `"Amount must be positive"` - Negative or zero amount
- `"Unexpected error: X"` - Other processing errors

**Note**: Missing currency or optimization mode are NOT errors - they use smart defaults based on language and greedy mode respectively.

### File-Level Errors
- **400 Bad Request**: Invalid file format, encoding issues, missing required column (amount)
- **500 Internal Server Error**: Unexpected processing failures

### Partial Success
The API processes all rows and returns results for both successful and failed rows. A single invalid row does not stop processing of other rows.

## Response Fields

### Summary Fields
- `total_rows`: Total number of rows processed (excluding header)
- `successful`: Count of successfully processed rows
- `failed`: Count of failed rows
- `processing_time_seconds`: Time taken to process all rows
- `saved_to_history`: Whether results were saved to database

### Result Fields (per row)
**Success Response:**
- `row_number`: CSV row number (starts at 2, since 1 is header)
- `status`: "success"
- `amount`: Processed amount
- `currency`: Currency code
- `optimization_mode`: Applied optimization mode
- `total_notes`: Count of notes in breakdown
- `total_coins`: Count of coins in breakdown
- `total_denominations`: Total count of all denominations
- `breakdowns`: Array of denomination details
- `calculation_id`: Database ID (if saved to history)

**Error Response:**
- `row_number`: CSV row number
- `status`: "error"
- `amount`: Attempted amount (may be invalid)
- `currency`: Attempted currency (may be invalid)
- `optimization_mode`: Attempted mode (may be invalid)
- `error`: Detailed error message

## Usage Examples

### cURL Example
```bash
curl -X POST "http://localhost:8001/api/v1/bulk-upload?save_to_history=true" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample_bulk_upload.csv"
```

### Python Example
```python
import requests

url = "http://localhost:8001/api/v1/bulk-upload"
files = {"file": open("sample_bulk_upload.csv", "rb")}
params = {"save_to_history": True}

response = requests.post(url, files=files, params=params)
result = response.json()

print(f"Processed {result['total_rows']} rows")
print(f"Success: {result['successful']}, Failed: {result['failed']}")
print(f"Processing time: {result['processing_time_seconds']}s")

# Check for errors
for row in result['results']:
    if row['status'] == 'error':
        print(f"Row {row['row_number']}: {row['error']}")
```

### JavaScript Example
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:8001/api/v1/bulk-upload?save_to_history=true', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(`Processed ${result.total_rows} rows`);
console.log(`Success: ${result.successful}, Failed: ${result.failed}`);

// Display results
result.results.forEach(row => {
  if (row.status === 'success') {
    console.log(`Row ${row.row_number}: ${row.amount} ${row.currency} -> ${row.total_denominations} denominations`);
  } else {
    console.error(`Row ${row.row_number}: ${row.error}`);
  }
});
```

## Performance Considerations

### Processing Speed
- Typical processing: ~50-100 rows/second
- Large files (1000+ rows): May take 10-20 seconds
- Processing is synchronous - response waits for all rows

### Database Impact
- If `save_to_history=true`, each successful row creates a database entry
- Uses individual commits per row for reliability
- Failed rows do not create database entries

### Memory Usage
- Entire file is loaded into memory
- Large files (10MB+) may require more server memory
- Consider splitting very large files (10,000+ rows)

## Best Practices

1. **Test with Small Files First**
   - Start with 10-20 rows to verify format
   - Check error messages for validation issues

2. **Use UTF-8 Encoding**
   - Ensures proper handling of currency symbols
   - Prevents encoding-related errors

3. **Include Headers**
   - First row must contain column names
   - Use exact names: `amount`, `currency`, `optimization_mode`

4. **Validate Data Before Upload**
   - Ensure all amounts are valid numbers
   - Verify currency codes are 3 letters
   - Check for empty rows

5. **Handle Partial Failures**
   - Always check the `failed` count in response
   - Review error messages for failed rows
   - Re-upload corrected rows if needed

6. **Monitor Processing Time**
   - Use `processing_time_seconds` to gauge performance
   - Split large files if processing takes too long

## Troubleshooting

### Common Issues

**"CSV must contain required columns"**
- Solution: Ensure first row has headers: `amount,currency`

**"File encoding error"**
- Solution: Save CSV as UTF-8 encoding

**"Invalid amount format"**
- Solution: Check for non-numeric characters in amount column

**"Currency must be 3-letter code"**
- Solution: Use standard codes (INR, USD, EUR, GBP)

**"File must be a CSV file"**
- Solution: Ensure file extension is `.csv`

### Debugging Tips

1. Check the `row_number` in error responses
2. Review the original CSV file at that line
3. Verify column values match requirements
4. Test individual rows via `/api/v1/calculate` endpoint
5. Check API documentation at `/docs`

## Integration with Desktop App

The desktop application can integrate this feature with:

1. **File Upload Button**
   ```jsx
   <input 
     type="file" 
     accept=".csv" 
     onChange={handleFileUpload}
   />
   ```

2. **Progress Indicator**
   - Show upload progress
   - Display processing status
   - Update when complete

3. **Results Display**
   - Show success/failure summary
   - List successful calculations
   - Highlight errors with row numbers

4. **Error Handling**
   - Display user-friendly error messages
   - Allow re-upload of corrected file
   - Provide CSV template download

## Future Enhancements

- [ ] Excel (.xlsx) file support
- [ ] Real-time progress updates for large files
- [ ] Async processing for very large files
- [ ] Download template CSV
- [ ] Batch export of results
- [ ] Validation preview before processing
- [ ] Support for additional columns (notes, tags, etc.)

## API Documentation

Full interactive documentation available at:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Support

For issues or questions:
1. Check this documentation
2. Review API docs at `/docs`
3. Check sample CSV file
4. Test with minimal example
