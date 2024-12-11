import sys
import json
from datetime import datetime

# Simulating database-like output
def generate_dummy_data(payload):
    product_id = payload.get("productId")
    vendor_name = payload.get("vendorName")
    product_name = payload.get("productName")
    
    data = {
        "productId": product_id,
        "vendorName": vendor_name,
        "productName": product_name,
        "cveIds": [f"CVE-2024-00{index}" for index in range(1, 4)],
        "publishedDates": [
            "2024-01-01",
            "2024-02-01",
            "2024-03-01"
        ],
        "description": f"Vulnerabilities description for {product_name}.",
        "mitigations": [
            "Update to the latest firmware.",
            "Restrict network access.",
            "Monitor unusual activities."
        ],
        "totalVulnerabilities": 3,
        "createdAt": datetime.now().isoformat()
    }
    return data

# Main function to process the input
if __name__ == "__main__":
    input_payload = sys.argv[1]
    payload = json.loads(input_payload)
    
    # Generate the dummy data
    result = generate_dummy_data(payload)
    
    # Return the data in JSON format
    print(json.dumps(result))
