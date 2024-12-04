import sys
import json

def main():
    try:
        # Read input from stdin
        input_data_str = sys.stdin.read().strip()
        
        if not input_data_str:
            print(json.dumps({"error": "No input provided."}))
            sys.exit(1)

        # Parse the input JSON
        input_data = json.loads(input_data_str)

        # Extract product details
        product_name = input_data.get("productName", "Unknown Product")
        product_version = input_data.get("productVersion", "Unknown Version")
        cve_id = input_data.get("cveId", "N/A")

        # Generate dummy output
        output = [
            {
                "cve_id": cve_id,
                "vulnerabilityDescription": f"Dummy gjgjkhkhk for {product_name} version {product_version}.",
                "published_date": "2024-08-01",
                "last_modified": "2024-09-02",
                "vuln_status": "Active",
                "baseScore": "9.5",
                "baseSeverity": "medium",
                "oemUrl": "https://example.com/vulnerability-details"
            },
                        {
                "cve_id": cve_id,
                "vulnerabilityDescription": f"gkhkhkhkhty for {product_name} version {product_version}.",
                "published_date": "2024-01-01",
                "last_modified": "2024-01-02",
                "vuln_status": "Active",
                "baseScore": "3.5",
                "baseSeverity": "low",
                "oemUrl": "https://example.com/vulnerability-details"
            }
        ]

        # Print the output as JSON
        print(json.dumps(output))
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"JSON parsing error: {e}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {e}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
