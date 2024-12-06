import sys
import json

def perform_scan(scan_data):
    # Mock scanning logic
    print(f"Scanning for user: {scan_data['userId']}")
    for entry in scan_data['scanData']:
        print(f"Vendor: {entry['vendorWebsite']}, Products: {entry['products']}")

if __name__ == "__main__":
    scan_data = json.loads(sys.argv[1])
    perform_scan(scan_data)
