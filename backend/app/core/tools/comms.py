from pydantic import Field

from app.core.tools.base import BaseTool


class DraftEmail(BaseTool):
    """
    Drafts an email to a recipient.
    Use this when the user asks to write, draft, or prepare an email.
    """

    to: str | None = Field(None, description="The recipient's email address.")
    subject: str = Field(..., description="The subject line of the email.")
    body: str = Field(..., description="The main content of the email.")

    async def run(self) -> dict:
        # In this autonomous architecture, the tool doesn't "send" the email,
        # but it returns the structured draft that the UI can then handle.
        return {"status": "draft_created", "email_draft": {"to": self.to, "subject": self.subject, "body": self.body}}
