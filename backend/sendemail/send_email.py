import sys
import json

# Simulate sending email
def simulate_send_email(user_id, scan_details):
    # Just simulate the email send for testing
    email_message = f"Sending email to user {user_id} with the following scan details:\n"
    email_message += f"Product: {scan_details['product_name']}\n"
    email_message += f"Version: {scan_details['product_version']}\n"
    email_message += f"CVE ID: {scan_details['cve_id']}\n"
    email_message += f"Severity: {scan_details['severity']}\n"
    email_message += f"Description: {scan_details['description']}\n"
    email_message += f"Mitigation: {scan_details['mitigation']}\n"
    email_message += f"Published Date: {scan_details['published_date']}\n"
    
    # Simulate sending the email (for testing purposes)
    print(f"Email sent successfully with the following content:\n{email_message}")
    return "Email sent successfully"

# Main function to receive input and simulate email sending
if __name__ == "__main__":
    try:
        # Receive input from Node.js (assuming it's passed as a JSON string)
        input_data = sys.argv[1]
        email_data = json.loads(input_data)

        # Extract details
        user_id = email_data.get("userId", "")
        scan_details = email_data.get("scanDetails", {})

        # Simulate email sending
        email_result = simulate_send_email(user_id, scan_details)

        # Return the result to Node.js
        print(email_result)

    except Exception as e:
        print(f"Error in sending email: {e}")
