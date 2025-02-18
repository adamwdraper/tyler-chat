import uuid
from datetime import datetime, UTC

class Message:
    def __init__(
        self,
        role: str,
        content: str,
        name: str = None,
        tool_call_id: str = None,
        tool_calls: list = None,
        attributes: dict = None,
        source: dict = None,
        attachments: list = None,
        id: str = None,
        sequence: int = None,
        timestamp: str = None,
        metrics: dict = None
    ):
        self.id = id or str(uuid.uuid4())
        self.role = role
        self.content = content
        self.name = name
        self.tool_call_id = tool_call_id
        self.tool_calls = tool_calls or []
        self.attributes = attributes or {}
        self.source = source
        self.attachments = attachments or []
        self.sequence = sequence
        self.timestamp = timestamp or datetime.now(UTC).isoformat()
        self.metrics = metrics or {}

    def to_dict(self) -> dict:
        """Convert the message to a dictionary representation."""
        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "name": self.name,
            "tool_call_id": self.tool_call_id,
            "tool_calls": self.tool_calls,
            "attributes": self.attributes,
            "source": self.source,
            "attachments": [
                {
                    "filename": attachment.filename,
                    "mime_type": attachment.mime_type,
                    "url": attachment.get_url() if hasattr(attachment, 'get_url') else None
                } for attachment in self.attachments
            ],
            "sequence": self.sequence,
            "timestamp": self.timestamp,
            "metrics": self.metrics
        } 