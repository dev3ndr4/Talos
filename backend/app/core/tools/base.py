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

        def clean_schema(s: Any) -> Any:
            if isinstance(s, dict):
                res = {}
                for k, v in s.items():
                    if k == "properties":
                        res[k] = {pk: clean_schema(pv) for pk, pv in v.items()}
                    elif k not in ["additionalProperties", "title"]:
                        res[k] = clean_schema(v)

                # Special handling for Optional fields represented as anyOf
                if "anyOf" in res and len(res["anyOf"]) == 2:
                    types = [i.get("type") for i in res["anyOf"] if isinstance(i, dict)]
                    if "null" in types:
                        other_type = [t for t in types if t != "null"]
                        if other_type:
                            res["type"] = other_type[0]
                            res["nullable"] = True
                            del res["anyOf"]

                # Ensure type is present
                if "type" not in res and "properties" in res:
                    res["type"] = "object"
                return res
            elif isinstance(s, list):
                return [clean_schema(i) for i in s]
            return s

        cleaned_schema = clean_schema(schema)

        # Extract description from class docstring if not provided
        description = cls.__doc__ or "No description provided."

        return {
            "type": "function",
            "function": {
                "name": cls.__name__,
                "description": description.strip(),
                "parameters": cleaned_schema,
            },
        }

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
