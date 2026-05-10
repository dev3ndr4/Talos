import os

import yaml
from pydantic import Field

from app.core.tools.base import BaseTool

WIKI_DIR = "knowledge/wiki"


class WriteWikiPage(BaseTool):
    """
    Creates or updates a synthesized wiki page in the Knowledge Brain.
    Use this to 'compile' information into a permanent, structured format.
    The content should be Markdown with YAML frontmatter.
    """

    title: str = Field(..., description="The title of the page (e.g., 'Distributed-Systems').")
    content: str = Field(..., description="The full Markdown content of the page.")
    metadata: dict = Field(default_factory=dict, description="YAML frontmatter data (tags, links, etc.).")

    async def run(self) -> str:
        # Sanitize filename
        filename = self.title.replace(" ", "-").replace("/", "-") + ".md"
        file_path = os.path.join(WIKI_DIR, filename)

        try:
            # Construct page with frontmatter
            full_content = "---\n"
            full_content += yaml.dump(self.metadata)
            full_content += "---\n\n"
            full_content += self.content

            with open(file_path, "w") as f:
                f.write(full_content)
            return f"SUCCESS: Wiki page '{self.title}' written to {file_path}."
        except Exception as e:
            return f"ERROR: Failed to write wiki page: {str(e)}"


class ReadWikiPage(BaseTool):
    """
    Reads a synthesized wiki page from the Knowledge Brain.
    """

    title: str = Field(..., description="The title of the page to read.")

    async def run(self) -> str:
        filename = self.title.replace(" ", "-").replace("/", "-") + ".md"
        file_path = os.path.join(WIKI_DIR, filename)

        try:
            with open(file_path) as f:
                return f.read()
        except FileNotFoundError:
            return f"ERROR: Wiki page '{self.title}' not found."
        except Exception as e:
            return f"ERROR: {str(e)}"


class ListWikiPages(BaseTool):
    """
    Lists all available concepts and pages in the LLM Wiki.
    """

    async def run(self) -> str:
        try:
            pages = [f.replace(".md", "") for f in os.listdir(WIKI_DIR) if f.endswith(".md")]
            if not pages:
                return "The wiki is currently empty. Start by compiling information."
            return "\n".join(pages)
        except Exception as e:
            return f"ERROR: {str(e)}"
