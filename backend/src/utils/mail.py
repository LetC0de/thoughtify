import resend
from src.utils.settings import settings


RESEND_API_KEY = settings.RESEND_API_KEY

resend.api_key = RESEND_API_KEY



def _send_email(recipient: str, subject: str, html: str):
    """Send via Resend API (uses HTTP/443 — works on Render)."""
    try:
        response = resend.Emails.send({
            "from": "FreeSpeak.in <noreply@freespeak.in>",
            "to": recipient,
            "subject": subject,
            "html": html,
        })
        print(f"Email sent to {recipient}: {subject} (id={response.get('id')})")
    except Exception as e:
        print(f"Email FAILED to {recipient}: {subject} — {e}")


def otp_email_html(otp: str) -> str:
    return f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#14100c;border-radius:16px;padding:2rem;border:1px solid rgba(212,148,58,0.2);">
        <div style="text-align:center;margin-bottom:1.5rem;">
            <span style="font-size:2rem;">✦</span>
            <h1 style="color:#f0e6d8;font-size:1.4rem;margin:0.5rem 0 0;">FreeSpeak.in</h1>
        </div>
        <p style="color:#c4b5a0;font-size:0.95rem;text-align:center;">Your verification code</p>
        <div style="background:#1e1813;border-radius:12px;padding:1.5rem;text-align:center;margin:1rem 0;border:1px solid rgba(212,148,58,0.1);">
            <span style="font-size:2.2rem;letter-spacing:0.3em;font-weight:700;color:#e8b45a;">{otp}</span>
        </div>
        <p style="color:#8a7a68;font-size:0.8rem;text-align:center;">Expires in <strong style="color:#c4b5a0;">5 minutes</strong></p>
        <div style="height:1px;background:linear-gradient(to right,transparent,rgba(212,148,58,0.2),transparent);margin:1.5rem 0;"></div>
        <p style="color:#8a7a68;font-size:0.75rem;text-align:center;">FreeSpeak &bull; A Sanctuary for Ideas</p>
    </div>
    """


def welcome_email_html() -> str:
    return """
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#14100c;border-radius:20px;padding:2.5rem;border:1px solid rgba(212,148,58,0.15);">
        <div style="text-align:center;margin-bottom:1.5rem;">
            <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#d4943a,#e8b45a);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
                <span style="font-size:1.6rem;color:#0c0907;">✦</span>
            </div>
            <h1 style="color:#f0e6d8;font-size:1.6rem;margin:0;">FreeSpeak.in</h1>
        </div>
        <p style="color:#c4b5a0;font-size:1rem;text-align:center;line-height:1.6;">
            Welcome to <strong style="color:#e8b45a;">FreeSpeak</strong>
        </p>
        <div style="background:#1e1813;border-radius:14px;padding:1.5rem 2rem;margin:1.5rem 0;border:1px solid rgba(212,148,58,0.08);text-align:center;">
            <p style="color:#f0e6d8;font-size:1.05rem;margin:0 0 0.5rem;">Your account is ready ✦</p>
            <p style="color:#c4b5a0;font-size:0.9rem;margin:0;line-height:1.5;">Start sharing your thoughts!</p>
        </div>
        <div style="height:1px;background:linear-gradient(to right,transparent,rgba(212,148,58,0.15),transparent);margin:1.5rem 0;"></div>
        <p style="color:#8a7a68;font-size:0.75rem;text-align:center;">FreeSpeak &bull; A Sanctuary for Ideas</p>
    </div>
    """
