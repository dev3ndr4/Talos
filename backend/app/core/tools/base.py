from typing import Any

from pydantic import BaseModel


class BaseTool(BaseModel):
    """
    Base class for all Talos Tools.
    Leverages Pydantic for schema generation and validation.
    """

    @classmethod
    def get_schema(cls) -> dict:
        """
        Returns the tool definition in OpenAI/LiteLLM format.
        """
        schema = cls.model_json_schema()

        # Extract description from class docstring if not provided
        description = cls.__doc__ or "No description provided."

        return {"type": "function", "function": {"name": cls.__name__, "description": description.strip(), "parameters": schema}}

    async def run(self, **kwargs) -> Any:
        """
        The actual execution logic of the tool.
        Must be implemented by subclasses.
        """
        raise NotImplementedError("Subclasses must implement run()")


class ToolResult(BaseModel):
    """
    Standardized result format for tool execution.
    """

    tool_name: str
    output: Any
    success: bool = True
    error: str | None = None
