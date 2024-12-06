# import sys
# import json

# def main():
#     try:
#         # Read input from stdin
#         input_data_str = sys.stdin.read().strip()
        
#         if not input_data_str:
#             print(json.dumps({"error": "No input provided."}))
#             sys.exit(1)

#         # Parse the input JSON
#         input_data = json.loads(input_data_str)

#         # Extract product details
#         product_name = input_data.get("productName", "Unknown Product")
#         product_version = input_data.get("productVersion", "Unknown Version")
#         cve_id = input_data.get("cveId", "N/A")

#         # Generate dummy output
#         output = [
#             {
#                 "cve_id": cve_id,
#                 "vulnerabilityDescription": f"Dummy aaaaaaaaaaak for {product_name} version {product_version}.",
#                 "published_date": "2024-08-01",
#                 "last_modified": "2024-09-02",
#                 "vuln_status": "Active",
#                 "baseScore": "9.5",
#                 "baseSeverity": "high",
#                 "oemUrl": "https://example.com/vulnerability-details"
#             },
#                         {
#                 "cve_id": cve_id,
#                 "vulnerabilityDescription": f"gaaaakhty for {product_name} version {product_version}.",
#                 "published_date": "2024-01-01",
#                 "last_modified": "2024-01-02",
#                 "vuln_status": "Active",
#                 "baseScore": "3.5",
#                 "baseSeverity": "critical",
#                 "oemUrl": "https://example.com/vulnerability-details"
#             }
#         ]

#         # Print the output as JSON
#         print(json.dumps(output))
#     except json.JSONDecodeError as e:
#         print(json.dumps({"error": f"JSON parsing error: {e}"}))
#         sys.exit(1)
#     except Exception as e:
#         print(json.dumps({"error": f"Unexpected error: {e}"}))
#         sys.exit(1)

# if __name__ == "__main__":
#     main()


import sys
import json
from monitor_nvd import QuickScan
import asyncio

# def perform_scan(product_name, product_version, cve_id):
#     # Simulate scanning logic and return structured results
#     return {
#         "product_name": product_name,
#         "product_version": product_version or "N/A",
#         "cve_id": cve_id or "N/A",
#         "severity": "High" if product_name.lower() == "criticalproduct" else "Low",
#         "description": f"Simulated vulnerability for {product_name} version {product_version}",
#         "mitigation": "Update to the latest version",
#         "published_date": "2024-12-01"
#     }

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

async def main():
    
    try:
        # Check if an argument was passed
        input_data = sys.stdin.read()  # Read all input passed to stdin from Node.js data
        # Get the input argument

        # Parse the input to create valid JSON
        scan_data = json.loads(input_data)

        # Extract values from the parsed data
        product_name = scan_data.get("productName", "")
        # product_version = scan_data.get("productVersion", "")
        # cve_id = scan_data.get("cveId", "")

        # Perform the scan
        runScan = QuickScan(product_name=product_name)
        data = await runScan.parse_formatted_data()
        # scan_results = perform_scan(product_name, product_version, cve_id)
        


        # Output results (only the JSON response, no debug info)
        print(json.dumps(data, indent=4))

    except Exception as e:
        print(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

if __name__ == "__main__":
    asyncio.run(main())

