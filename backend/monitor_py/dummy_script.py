import sys
import json
from datetime import datetime, timedelta
import random

# Simulating database-like output
def generate_dummy_data(payload):
    product_id = payload.get("productId")
    vendor_name = payload.get("vendorName")
    product_name = payload.get("productName")

    # Dynamically generate recent dates for CVEs
    today = datetime.today()
    published_dates = [
        (today - timedelta(days=i * 30)).strftime("%Y-%m-%d")  # 1 month apart
        for i in range(3)
    ]

    # Construct the output data
    data = {
        "productId": product_id,
        "vendorName": vendor_name,
        "productName": product_name,
        "cveIds": [f"CVE-2024-00{index}" for index in range(1, 9)],
        "publishedDates": published_dates,
        "description": f"Vulnerabilities description for {product_name}.",
        "mitigations": [
            "Update to the latest firmware.",
            "Restrict network access.",
            "Monitor unusual activities."
        ],
        "severity": "Critical",
        "totalVulnerabilities": len(published_dates),
        "notification": random.randint(1, 10),  # Single random value
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
