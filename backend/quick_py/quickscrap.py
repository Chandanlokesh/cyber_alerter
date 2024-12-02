import sys
import json

def perform_scan(product_name, product_version, cve_id):
    # Simulate scanning logic and return structured results
    return {
        "product_name": product_name,
        "product_version": product_version or "N/A",
        "cve_id": cve_id or "N/A",
        "severity": "High" if product_name.lower() == "criticalproduct" else "Low",
        "description": f"Simulated vulnerability for {product_name} version {product_version}",
        "mitigation": "Update to the latest version",
        "published_date": "2024-12-01"
    }

def parse_input(input_str):
    # Remove outer braces if present
    input_str = input_str.strip('{}')
    
    # Split the input into key-value pairs
    pairs = [pair.strip() for pair in input_str.split(',')]
    
    # Create a dictionary to store parsed values
    parsed_dict = {}
    
    for pair in pairs:
        # Split each pair into key and value
        key, value = pair.split(':', 1)
        
        # Remove any whitespace and quotes
        key = key.strip().strip("'\"")
        value = value.strip().strip("'\"")
        
        # Add to parsed dictionary
        parsed_dict[key] = value
    
    # Convert to JSON string
    return json.dumps(parsed_dict)

def main():
    try:
        # Check if an argument was passed
        if len(sys.argv) < 2:
            print("Error: No input provided")
            sys.exit(1)

        # Get the input argument
        input_arg = sys.argv[1]

        # Parse the input to create valid JSON
        parsed_input = parse_input(input_arg)
        scan_data = json.loads(parsed_input)

        # Extract values from the parsed data
        product_name = scan_data.get("productName", "")
        product_version = scan_data.get("productVersion", "")
        cve_id = scan_data.get("cveId", "")

        # Perform the scan
        scan_results = perform_scan(product_name, product_version, cve_id)

        # Output results (only the JSON response, no debug info)
        print(json.dumps(scan_results, indent=4))

    except Exception as e:
        print(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
