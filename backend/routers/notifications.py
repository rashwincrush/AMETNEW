from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
from ..external_integrations.whatsapp import send_whatsapp_template_message
from ..external_integrations.email import send_email

router = APIRouter()

class WhatsAppTemplateMessage(BaseModel):
    to_number: str
    template_name: str
    parameters: Dict[str, str]

class EmailMessage(BaseModel):
    to_email: str
    subject: str
    html_content: str

@router.post("/notifications/whatsapp")
def post_whatsapp_message(payload: WhatsAppTemplateMessage):
    ticket_id = send_whatsapp_template_message(payload.to_number, payload.template_name, payload.parameters)
    if ticket_id:
        return {"status": "success", "ticket_id": ticket_id}
    raise HTTPException(status_code=500, detail="Failed to send WhatsApp message.")

@router.post("/notifications/email")
def post_email_message(payload: EmailMessage):
    status_code = send_email(payload.to_email, payload.subject, payload.html_content)
    if status_code == 202: # SendGrid returns 202 Accepted
        return {"status": "success"}
    raise HTTPException(status_code=500, detail="Failed to send email.")
