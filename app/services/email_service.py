import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(subject:str,html_content:str):
    sender_email=os.getenv("EMAIL_ADDRESS")
    app_password=os.getenv("EMAIL_APP_PASSWORD")

    if not send_email or not app_password:
        raise ValueError("Email Credentials are not set in environment variables.")
    
    msg=MIMEMultipart("alternative")
    msg["From"]=sender_email
    msg["To"]=sender_email
    msg["Subject"]=subject

    msg.attach(MIMEText(html_content,"html"))

    with smtplib.SMTP_SSL("smtp.gmail.com",465) as server:
        server.login(sender_email,app_password)
        server.send_message(msg)