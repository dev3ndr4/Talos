import os
import subprocess

from pydantic import Field

from app.core.tools.base import BaseTool


class ReadFile(BaseTool):
    """
    Reads the content of a file within the project repository.
    Use this to understand the codebase or retrieve information from documents.
    """

    file_path: str = Field(..., description="The relative path to the file to read.")

    async def run(self) -> str:
        # Security: Prevent reading files outside the project root
        if ".." in self.file_path or self.file_path.startswith("/"):
            return "ERROR: Access denied. You can only read files within the project directory."

        try:
            with open(self.file_path) as f:
                content = f.read()
                return content[:5000]  # Limit output
        except FileNotFoundError:
            return f"ERROR: File '{self.file_path}' not found."
        except Exception as e:
            return f"ERROR: {str(e)}"


class ListFiles(BaseTool):
    """
    Lists files in a directory recursively.
    Use this to explore the project structure.
    """

    directory: str = Field(".", description="The relative path to the directory to list.")

    async def run(self) -> str:
        if ".." in self.directory or self.directory.startswith("/"):
            return "ERROR: Access denied."

        try:
            files = []
            for root, _, filenames in os.walk(self.directory):
                if ".git" in root or "__pycache__" in root or "node_modules" in root:
                    continue
                for filename in filenames:
                    files.append(os.path.join(root, filename))
            return "\n".join(files[:100])  # Limit to first 100 files
        except Exception as e:
            return f"ERROR: {str(e)}"


class GrepSearch(BaseTool):
    """
    Searches for a string pattern in the codebase.
    Equivalent to 'grep -r'.
    """

    pattern: str = Field(..., description="The string or regex pattern to search for.")
    directory: str = Field(".", description="The relative path to the directory to search in.")

    async def run(self) -> str:
        if ".." in self.directory or self.directory.startswith("/"):
            return "ERROR: Access denied."

        try:
            # Use subprocess to run grep safely
            result = subprocess.run(["grep", "-r", "--exclude-dir=.git", "--exclude-dir=node_modules", "-l", self.pattern, self.directory], capture_output=True, text=True, timeout=10)
            return result.stdout if result.stdout else "No matches found."
        except subprocess.TimeoutExpired:
            return "ERROR: Search timed out."
        except Exception as e:
            return f"ERROR: {str(e)}"


class WebSearch(BaseTool):
    """
    Performs a web search to retrieve up-to-date information from the internet.
    Use this when you need facts, news, or documentation not in your local memory.
    """

    query: str = Field(..., description="The search query to perform.")

    async def run(self) -> str:
        # In Phase 3, we use LiteLLM's completion with a search-capable model
        # or a dedicated search provider like Tavily.
        # For now, we provide a structured placeholder that can be easily
        # upgraded by setting the appropriate environment variables.

        tavily_key = os.getenv("TAVILY_API_KEY")
        if not tavily_key:
            return f"MOCK WEB SEARCH (TAVILY_API_KEY missing) for '{self.query}': Talos v2 is the next generation of autonomous business agents, featuring deep tool integration and self-correction loops."

        try:
            # Placeholder for actual Tavily/Google call
            # result = await search_provider.search(self.query)
            return f"SUCCESS: Search results for '{self.query}' would appear here if integrated with a provider."
        except Exception as e:
            return f"ERROR: Web search failed: {str(e)}"
