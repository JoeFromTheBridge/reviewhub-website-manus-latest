import os
import smtplib
import ssl
from email.utils import parseaddr, formataddr
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

# ---- Optional .env support (safe if not present) ----
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass


class EmailService:
    def __init__(self):
        # Feature flag: use SendGrid Web API when EMAIL_BACKEND=sendgrid_api
        self.use_sendgrid_api = (os.getenv("EMAIL_BACKEND", "").lower() == "sendgrid_api")
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")

        # Sender (supports "Name <email>" or plain address)
        raw_sender = os.getenv("FROM_EMAIL") or os.getenv("MAIL_DEFAULT_SENDER", "noreply@reviewhub.com")
        parsed_name, parsed_email = parseaddr(raw_sender)
        self.from_email = parsed_email or raw_sender
        self.from_name = os.getenv("FROM_NAME", os.getenv("MAIL_DEFAULT_SENDER_NAME", parsed_name or "ReviewHub"))

        # SMTP config (fallback path)
        self.smtp_server = os.getenv("SMTP_SERVER") or os.getenv("MAIL_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT") or os.getenv("MAIL_PORT") or 587)
        self.smtp_username = os.getenv("SMTP_USERNAME") or os.getenv("MAIL_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD") or os.getenv("MAIL_PASSWORD", "")
        self.use_tls = str(os.getenv("SMTP_USE_TLS") or os.getenv("MAIL_USE_TLS") or "true").lower() in ("1", "true", "yes", "on")
        self.use_ssl = str(os.getenv("SMTP_USE_SSL") or os.getenv("MAIL_USE_SSL") or "false").lower() in ("1", "true", "yes", "on")

    # ---------------- Core send ----------------
    def send_email(self, to_email, subject, html_content, text_content=None):
        """
        Sends an email using (1) SendGrid Web API when enabled, else (2) SMTP.
        Returns True on success, False on failure (and logs context).
        """
        sender_formatted = formataddr((self.from_name, self.from_email))

        # --- Path 1: SendGrid Web API ---
        if self.use_sendgrid_api and self.sendgrid_api_key:
            try:
                from sendgrid import SendGridAPIClient
                from sendgrid.helpers.mail import Mail
                msg = Mail(
                    from_email=sender_formatted,
                    to_emails=to_email,
                    subject=subject,
                    html_content=html_content or (text_content or "")
                )
                if text_content:
                    # Add a plain-text part for better deliverability
                    msg.add_content(text_content, "text/plain")
                sg = SendGridAPIClient(self.sendgrid_api_key)
                sg.send(msg)  # raises on non-2xx
                return True
            except Exception as e:
                self._log_send_failure(e, via="sendgrid_api")
                return False

        # --- Path 2: SMTP fallback ---
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = sender_formatted
            msg["To"] = to_email

            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content or (text_content or ""), "html"))

            context = ssl.create_default_context()
            if self.use_ssl:
                server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port, context=context)
                server.ehlo()
            else:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=20)
                server.ehlo()
                if self.use_tls:
                    server.starttls(context=context)
                    server.ehlo()

            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)

            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            self._log_send_failure(e, via="smtp")
            return False

    # ---------------- Helpers ----------------
    def _log_send_failure(self, e, via="unknown"):
        try:
            masked_user = ""
            if self.smtp_username:
                masked_user = (self.smtp_username[:2] + "***@***") if "@" in self.smtp_username else (self.smtp_username[:2] + "***")
            details = {
                "via": via,
                "server": self.smtp_server,
                "port": self.smtp_port,
                "use_tls": self.use_tls,
                "use_ssl": self.use_ssl,
                "username": masked_user,
                "from": f"{self.from_name} <{self.from_email}>",
                "sg_api": bool(self.sendgrid_api_key),
            }
            current_app.logger.error(f"Email send failure: {e}; context={details}")
        except Exception:
            pass

    # ---------------- Templates ----------------
    def send_verification_email(self, user_email, username, verification_token):
        app_base = (os.getenv("APP_BASE_URL") or os.getenv("FRONTEND_URL", "http://localhost:3000")).rstrip("/")
        verification_url = f"{app_base}/verify-email?token={verification_token}"

        if str(os.getenv("EMAIL_DEBUG_LOG", "0")).lower() in ("1", "true", "yes", "on"):
            try:
                current_app.logger.info(f"EMAIL_DEBUG: Verification URL for {user_email}: {verification_url}")
            except Exception:
                pass

        subject = "Verify Your ReviewHub Account"
        html_content = f"""
        <!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <style>body{{font-family:Arial,sans-serif;line-height:1.6;color:#333}}.container{{max-width:600px;margin:0 auto;padding:20px}}
        .header{{background:linear-gradient(135deg,#2563EB,#10B981);color:#fff;padding:30px;text-align:center;border-radius:8px 8px 0 0}}
        .content{{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}}.button{{display:inline-block;background:#2563EB;color:#fff;
        padding:12px 30px;text-decoration:none;border-radius:5px;margin:20px 0}}</style></head><body>
        <div class="container"><div class="header"><h1>Welcome to ReviewHub!</h1></div><div class="content">
        <h2>Hi {username},</h2><p>Thanks for signing up. Please verify your email address:</p>
        <p style="text-align:center;"><a href="{verification_url}" class="button">Verify Email Address</a></p>
        <p>If the button doesn't work, paste this link into your browser:</p>
        <p style="word-break:break-all;background:#e9e9e9;padding:10px;border-radius:4px">{verification_url}</p>
        <p>This link expires in 24 hours.</p><p>Best regards,<br/>The ReviewHub Team</p></div></div></body></html>
        """
        text_content = f"Verify your ReviewHub account:\n\n{verification_url}\n\nThis link expires in 24 hours."
        return self.send_email(user_email, subject, html_content, text_content)

    def send_password_reset_email(self, user_email, username, reset_token):
        app_base = (os.getenv("APP_BASE_URL") or os.getenv("FRONTEND_URL", "http://localhost:3000")).rstrip("/")
        reset_url = f"{app_base}/reset-password?token={reset_token}"
        subject = "Reset Your ReviewHub Password"
        html_content = f"""
        <!DOCTYPE html><html><body style="font-family:Arial,sans-serif">
        <h2>Password Reset Request</h2>
        <p>Hi {username}, click the link below to reset your password:</p>
        <p><a href="{reset_url}">{reset_url}</a></p>
        <p>This link expires in 1 hour. If you didn't request it, ignore this email.</p>
        </body></html>
        """
        text_content = f"Reset your ReviewHub password:\n\n{reset_url}\n\nThis link expires in 1 hour."
        return self.send_email(user_email, subject, html_content, text_content)

    def send_welcome_email(self, user_email, username):
        subject = "Welcome to ReviewHub - Let's Get Started!"
        html_content = f"""
        <!DOCTYPE html><html><body style="font-family:Arial,sans-serif">
        <h2>🎉 Welcome, {username}!</h2>
        <p>Your account is now active. Start exploring and writing reviews.</p>
        <p><a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}">Open ReviewHub</a></p>
        </body></html>
        """
        return self.send_email(user_email, subject, html_content)


def generate_token(length=32):
    import secrets, string
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


# Singleton
email_service = EmailService()
