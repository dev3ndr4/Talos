from app.core.tools.base import BaseTool, ToolResult


class ToolRegistry:
    """
    Centralized registry for all available tools in the Talos system.
    """

    def __init__(self):
        self._tools: dict[str, type[BaseTool]] = {}

    def register(self, tool_class: type[BaseTool]):
        """Registers a tool class."""
        self._tools[tool_class.__name__] = tool_class

    def get_all_schemas(self) -> list[dict]:
        """Returns schemas for all registered tools."""
        return [tool.get_schema() for tool in self._tools.values()]

    async def execute(self, tool_name: str, arguments: dict) -> ToolResult:
        """
        Executes a tool by name with the provided arguments.
        """
        tool_class = self._tools.get(tool_name)
        if not tool_class:
            return ToolResult(tool_name=tool_name, output=None, success=False, error=f"Tool '{tool_name}' not found in registry.")

        try:
            # Instantiate and validate arguments via Pydantic
            tool_instance = tool_class(**arguments)
            output = await tool_instance.run()
            return ToolResult(tool_name=tool_name, output=output)
        except Exception as e:
            return ToolResult(tool_name=tool_name, output=None, success=False, error=str(e))


# Global registry instance
registry = ToolRegistry()
