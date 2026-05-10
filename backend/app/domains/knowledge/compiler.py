import json
import logging
import os

import litellm

from app.core.config import settings
from app.core.tools.wiki import ListWikiPages, ReadWikiPage, WriteWikiPage

logger = logging.getLogger("talos.knowledge.compiler")


class KnowledgeCompiler:
    """
    The Synthesis Engine for the Talos Knowledge Brain.
    Responsible for merging new information into the existing wiki.
    """

    def __init__(self):
        self.model = settings.LLM_MODEL
        self.api_key = settings.GEMINI_API_KEY
        self.wiki_dir = "knowledge/wiki"

        if not os.path.exists(self.wiki_dir):
            os.makedirs(self.wiki_dir)

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

        response = await litellm.acompletion(model=self.model, messages=[{"role": "system", "content": prompt}], api_key=self.api_key, response_format={"type": "json_object"})

        plan = json.loads(response.choices[0].message.content)

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

        response = await litellm.acompletion(model=self.model, messages=[{"role": "system", "content": merge_prompt}], api_key=self.api_key)

        updated_content = response.choices[0].message.content

        # Write back (need to handle YAML extraction if writer expects it separate)
        # For simplicity, we can just write the whole thing as content if writer supports it
        # But WriteWikiPage adds its own frontmatter. Let's adjust writer or here.

        file_path = os.path.join(self.wiki_dir, f"{title.replace(' ', '-')}.md")
        with open(file_path, "w") as f:
            f.write(updated_content)

        return f"SUCCESS: Merged information into '{title}'."
