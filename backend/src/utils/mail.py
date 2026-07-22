from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType   
from typing import List


conf = ConnectionConfig(
    MAIL_USERNAME = "abhishekjiiofficial86@gmail.com",
    MAIL_PASSWORD = "kxrf qtwj jkkh nfig",
    MAIL_FROM = "abhishekjiiofficial86@gmail.com",
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_FROM_NAME="Thought Sharing App",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)



async def send_email(emails: List[str]):
    html = """<p>Thankyou for Registration on Thoughtify app</p> """

    message = MessageSchema(
        subject="Registration Confirmation",
        recipients=[emails] if isinstance(emails, str) else emails,
        body=html,
        subtype=MessageType.html)

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"✅ Email sent to {emails}")
    except Exception as e:
        print(f"❌ Email failed to {emails}: {e}")