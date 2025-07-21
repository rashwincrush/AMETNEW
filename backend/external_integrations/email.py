import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL')

def send_email(to_email: str, subject: str, html_content: str):
    """Sends an email using SendGrid."""
    if not all([SENDGRID_API_KEY, SENDER_EMAIL]):
        print("SendGrid credentials not configured.")
        return None

    message = Mail(
        from_email=SENDER_EMAIL,
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        return response.status_code
    except Exception as e:
        print(f"Error sending email: {e}")
        return None
