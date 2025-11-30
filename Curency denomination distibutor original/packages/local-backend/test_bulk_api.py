"""
Test script for bulk upload - NEW OCR SYSTEM
"""
import requests
import json

# Test CSV upload
print("=" * 60)
print("TESTING BULK UPLOAD - CSV FILE")
print("=" * 60)

url = "http://127.0.0.1:8001/api/calculations/bulk-upload"

with open("test_bulk_upload.csv", "rb") as f:
    files = {"file": ("test_bulk_upload.csv", f, "text/csv")}
    params = {"save_to_history": False}
    
    response = requests.post(url, files=files, params=params)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        
        print("\n" + "=" * 60)
        print(f"RESULTS SUMMARY:")
        print(f"Total Rows: {data['total_rows']}")
        print(f"Successful: {data['successful']}")
        print(f"Failed: {data['failed']}")
        print(f"Processing Time: {data['processing_time_seconds']}s")
        print("=" * 60)
        
        print("\nDETAILED RESULTS:")
        for result in data['results']:
            if result['status'] == 'success':
                print(f"✓ Row {result['row_number']}: {result['amount']} {result['currency']} → {result['total_denominations']} denominations")
            else:
                print(f"✗ Row {result['row_number']}: ERROR - {result.get('error', 'Unknown error')}")
    else:
        print(f"ERROR: {response.text}")
