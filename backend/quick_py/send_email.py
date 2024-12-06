import sys
import json

try:
    # Log the raw input to see if it is correctly passed
    input_data = sys.stdin.read()  # Read all input passed to stdin
    print(f"Raw input received: {input_data}")

    # Load the JSON data passed from Node.js
    email_data = json.loads(input_data)  # Parse the JSON data from stdin

    # Extract user email and scan details
    user_email = email_data.get("userEmail")
    scan_details = email_data.get("scanDetails")

    # Perform your email sending logic here
    print(f"Sending email to: {user_email}")
    print(f"Scan Details: {json.dumps(scan_details)}")  # Convert to JSON string

    # Simulate sending the email
    print("Email sent successfully")

except Exception as e:
    print(f"Error parsing JSON: {str(e)}")
