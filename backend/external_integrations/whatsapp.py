import os
import requests
import json

WATI_API_ENDPOINT = os.environ.get('WATI_API_ENDPOINT')
WATI_ACCESS_TOKEN = os.environ.get('WATI_ACCESS_TOKEN')

def send_whatsapp_template_message(to_number: str, template_name: str, parameters: dict):
    """Sends a WhatsApp template message using Wati."""
    if not all([WATI_API_ENDPOINT, WATI_ACCESS_TOKEN]):
        print("Wati credentials not configured.")
        return None

    url = f"{WATI_API_ENDPOINT}/api/v1/sendTemplateMessage"
    headers = {
        'Authorization': f'Bearer {WATI_ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    # Wati expects parameters as a list of objects with name and value
    broadcast_params = [{"name": key, "value": str(value)} for key, value in parameters.items()]
    
    payload = {
        "broadcast_name": f"api_broadcast_{template_name}",
        "template_name": template_name,
        "receivers": [
            {
                "whatsappNumber": to_number.replace('+', ''), # Wati expects number without '+'
                "customParams": broadcast_params
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        response_json = response.json()
        
        # Check for a successful response from Wati
        if response_json.get('result', False) is True or response_json.get('status') == 'success':
             return response_json.get('ticket_id', 'success')
        else:
            print(f"Error from Wati API: {response_json}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Error sending Wati template message: {e}")
        return None
