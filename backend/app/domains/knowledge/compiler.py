import asyncio
import json
import logging
import os
import random

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.tools.wiki import ListWikiPages, ReadWikiPage, WriteWikiPage

logger = logging.getLogger("talos.knowledge.compiler")


class KnowledgeCompiler:
    """
    The Synthesis Engine for the Talos Knowledge Brain.
    Responsible for merging new information into the existing wiki.
    Using official Google Gen AI SDK for stability.
    """

    def __init__(self):
        # The SDK expects the model name without the provider prefix
        self.model = settings.LLM_MODEL.split("/")[-1]
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.wiki_dir = "knowledge/wiki"

        if not os.path.exists(self.wiki_dir):
            os.makedirs(self.wiki_dir)

    async def _call_llm(self, prompt: str, json_mode: bool = False):
        """Helper to call LLM with retry logic."""
        max_retries = 5
        for attempt in range(max_retries):
            try:
                config = types.GenerateContentConfig(
                    system_instruction=prompt,
                    response_mime_type="application/json" if json_mode else None,
                )
                # For compiler, we usually don't have a history, just a single prompt.
                # The compiler currently uses system prompt as the main prompt.
                # We'll stick to that but use models.generate_content.
                response = self.client.models.generate_content(model=self.model, contents="Please process the information as instructed.", config=config)
                return response.text
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                wait_time = (2**attempt) + (random.uniform(0, 1))
                logger.warning(f"KnowledgeCompiler LLM call failed (attempt {attempt + 1}/{max_retries}): {e}. Retrying in {wait_time:.2f}s...")
                await asyncio.sleep(wait_time)

    async def compile_information(self, raw_content: str, source_name: str):
        """
        Synthesizes raw content and merges it into the wiki.
        """
        logger.info(f"Starting compilation for: {source_name}")

        # 1. Get existing concepts
        lister = ListWikiPages()
        existing_concepts = await lister.run()

        # 2. Ask LLM what to do
        prompt = f"""You are the Talos Knowledge Architect.
You have received new information from '{source_name}'.
Your goal is to decide how to integrate this into the existing Knowledge Wiki.

EXISTING CONCEPTS:
{existing_concepts}

NEW CONTENT:
{raw_content}

DECISION CRITERIA:
- Should we create a NEW page? (If the concept is significantly different)
- Should we UPDATE an existing page? (If this adds to or corrects existing knowledge)
- What are the tags and [[wiki-links]] to other pages?

Return a JSON object:
{{
  "actions": [
    {{
      "type": "create" | "update",
      "title": "Concept-Name",
      "reasoning": "Why this action?",
      "suggested_merges": "What specific facts to add or change?"
    }}
  ]
}}
"""

        content = await self._call_llm(prompt, json_mode=True)
        plan = json.loads(content)

        results = []
        for action in plan.get("actions", []):
            if action["type"] == "create":
                res = await self._create_page(action["title"], action["suggested_merges"])
                results.append(res)
            elif action["type"] == "update":
                res = await self._update_page(action["title"], action["suggested_merges"])
                results.append(res)

        return results

    async def _create_page(self, title: str, content_suggestion: str):
        """Creates a new wiki page."""
        writer = WriteWikiPage(title=title, content=content_suggestion, metadata={"source": "compiler", "status": "draft"})
        return await writer.run()

    async def _update_page(self, title: str, merge_instruction: str):
        """Updates an existing wiki page with new information."""
        reader = ReadWikiPage(title=title)
        current_content = await reader.run()

        if current_content.startswith("ERROR"):
            return f"Failed to update '{title}': {current_content}"

        # Perform LLM merge
        merge_prompt = f"""Merge the following NEW information into the EXISTING wiki page.
Maintain the structure, YAML frontmatter, and style. Ensure no information is lost.

EXISTING CONTENT:
{current_content}

NEW INFORMATION TO INTEGRATE:
{merge_instruction}

Return the COMPLETE updated Markdown content (including YAML frontmatter).
"""

        updated_content = await self._call_llm(merge_prompt, json_mode=False)

        # Write back (need to handle YAML extraction if writer expects it separate)
        file_path = os.path.join(self.wiki_dir, f"{title.replace(' ', '-')}.md")
        with open(file_path, "w") as f:
            f.write(updated_content)

        return f"SUCCESS: Merged information into '{title}'."
