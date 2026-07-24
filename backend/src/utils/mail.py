from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from typing import List


conf = ConnectionConfig(
    MAIL_USERNAME="abhishekjiiofficial86@gmail.com",
    MAIL_PASSWORD="kxrf qtwj jkkh nfig",
    MAIL_FROM="abhishekjiiofficial86@gmail.com",
    MAIL_PORT=465,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_FROM_NAME="FreeSpeak",
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


async def send_email(emails: List[str]):
    html = """<p>Thankyou for Registration on FreeSpeak app</p>"""

    message = MessageSchema(
        subject="Registration Confirmation",
        recipients=[emails] if isinstance(emails, str) else emails,
        body=html,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"Email sent to {emails}")
    except Exception as e:
        print(f"Email failed to {emails}: {e}")


async def send_otp_email(email: str, otp: str):
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #14100c; border-radius: 16px; padding: 2rem; border: 1px solid rgba(212,148,58,0.2);">
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <span style="font-size: 2rem;">✦</span>
            <h1 style="color: #f0e6d8; font-size: 1.4rem; margin: 0.5rem 0 0;">FreeSpeak</h1>
        </div>
        <p style="color: #c4b5a0; font-size: 0.95rem; text-align: center;">Your email verification code</p>
        <div style="background: #1e1813; border-radius: 12px; padding: 1.5rem; text-align: center; margin: 1rem 0; border: 1px solid rgba(212,148,58,0.1);">
            <span style="font-size: 2.2rem; letter-spacing: 0.3em; font-weight: 700; color: #e8b45a;">{otp}</span>
        </div>
        <p style="color: #8a7a68; font-size: 0.8rem; text-align: center;">This code expires in <strong style="color: #c4b5a0;">5 minutes</strong>. Do not share this code.</p>
        <div style="height: 1px; background: linear-gradient(to right, transparent, rgba(212,148,58,0.2), transparent); margin: 1.5rem 0;"></div>
        <p style="color: #8a7a68; font-size: 0.75rem; text-align: center;">If you didn't request this, you can ignore this email.</p>
    </div>
    """

    message = MessageSchema(
        subject="Your FreeSpeak Verification Code",
        recipients=[email],
        body=html,
        subtype=MessageType.html,
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"OTP email sent to {email}")
    except Exception as e:
        print(f"OTP email failed to {email}: {e}")
        raise e