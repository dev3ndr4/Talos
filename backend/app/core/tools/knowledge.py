import asyncio
import os
import subprocess

import requests
import wikipedia
from bs4 import BeautifulSoup
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
    Performs a native web search to retrieve relevant URLs.
    Use this when you need to find information on the internet.
    Follow up with FetchURL to read the content of a specific page.
    """

    query: str = Field(..., description="The search query to perform.")

    def _sync_search(self):
        try:
            from ddgs import DDGS

            with DDGS() as ddgs:
                results = list(ddgs.text(self.query, max_results=5))
            if not results:
                return "No results found."
            return "\n".join([f"- {res.get('title', 'No Title')} ({res.get('href', 'No URL')})" for res in results])
        except Exception as e:
            return f"ERROR: Web search failed: {str(e)}"

    async def run(self) -> str:
        return await asyncio.to_thread(self._sync_search)


class FetchURL(BaseTool):
    """
    Fetches the content of a web page and returns a summarized text version.
    Use this to read the details of a URL found via WebSearch.
    """

    url: str = Field(..., description="The full URL to fetch (must start with http/https).")

    def _sync_fetch(self):
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
            response = requests.get(self.url, headers=headers, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()

            # Get text
            text = soup.get_text()

            # Break into lines and remove leading/trailing whitespace
            lines = (line.strip() for line in text.splitlines())
            # Break multi-headlines into a line each
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            # Drop blank lines
            text = "\n".join(chunk for chunk in chunks if chunk)

            return text[:4000]  # Limit to first 4000 characters
        except Exception as e:
            return f"ERROR: Failed to fetch URL: {str(e)}"

    async def run(self) -> str:
        return await asyncio.to_thread(self._sync_fetch)


class WikipediaSearch(BaseTool):
    """
    Searches Wikipedia for a given topic and returns a summary.
    Use this for high-reliability general knowledge discovery.
    """

    query: str = Field(..., description="The topic to search for on Wikipedia.")

    def _sync_search(self):
        try:
            # First find pages
            search_results = wikipedia.search(self.query, results=3)
            if not search_results:
                return "No Wikipedia pages found for this topic."

            # Get summary of the first result
            summary = wikipedia.summary(search_results[0], sentences=5)
            return f"SOURCE: Wikipedia (Page: {search_results[0]})\n\n{summary}"
        except wikipedia.exceptions.DisambiguationError as e:
            return f"ERROR: The search term '{self.query}' is too broad. Options: {', '.join(e.options[:5])}"
        except Exception as e:
            return f"ERROR: Wikipedia search failed: {str(e)}"

    async def run(self) -> str:
        return await asyncio.to_thread(self._sync_search)
