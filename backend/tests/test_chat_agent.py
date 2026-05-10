from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.domains.chat.agent import ChatAgent


@pytest.mark.asyncio
async def test_agent_tool_output_wrapping():
    # Mock settings before initializing ChatAgent
    with patch("app.domains.chat.agent.settings") as mock_settings:
        mock_settings.LLM_MODEL = "gemini/gemini-pro"
        mock_settings.GEMINI_API_KEY = "test-key"

        agent = ChatAgent()
        agent.client = MagicMock()

        # Mock LLM response to call a tool
        mock_candidate = MagicMock()
        mock_part = MagicMock()
        mock_part.function_call = MagicMock()
        mock_part.function_call.name = "WebSearch"
        mock_part.function_call.args = {"query": "test"}
        mock_part.text = None
        mock_candidate.content = MagicMock(parts=[mock_part])

        # Second response (final)
        mock_final_candidate = MagicMock()
        mock_final_part = MagicMock()
        mock_final_part.function_call = None
        mock_final_part.text = '{"assistant_message": "Done", "reasoning_trace": "...", "chat_summary_update": "...", "user_profile_update": "..."}'
        mock_final_candidate.content = MagicMock(parts=[mock_final_part])

        agent.client.models.generate_content.side_effect = [MagicMock(candidates=[mock_candidate]), MagicMock(candidates=[mock_final_candidate])]

        # Mock tool registry to return a string
        with patch("app.domains.chat.agent.registry.execute", new_callable=AsyncMock) as mock_execute:
            mock_execute.return_value = MagicMock(success=True, output="No results found.", error=None)

            # Mock _load_instruction to avoid file system calls
            with patch.object(ChatAgent, "_load_instruction", return_value="Test instruction"):
                # This should NOT raise ValidationError
                result = await agent.process_message("user", "chat", [], "test", "coding")

                assert result["assistant_message"] == "Done"

                # Verify generate_content was called with a dict in the tool response
                call_args = agent.client.models.generate_content.call_args_list[1]
                contents = call_args.kwargs["contents"]
                tool_content = contents[-1]
                assert tool_content.role == "tool"
                # In our fix, we wrapped it in {"result": "..."}
                assert tool_content.parts[0].function_response.response == {"result": "No results found."}


@pytest.mark.asyncio
async def test_agent_tool_error_wrapping():
    # Mock settings before initializing ChatAgent
    with patch("app.domains.chat.agent.settings") as mock_settings:
        mock_settings.LLM_MODEL = "gemini/gemini-pro"
        mock_settings.GEMINI_API_KEY = "test-key"

        agent = ChatAgent()
        agent.client = MagicMock()

        # Mock LLM response to call a tool
        mock_candidate = MagicMock()
        mock_part = MagicMock()
        mock_part.function_call = MagicMock()
        mock_part.function_call.name = "WebSearch"
        mock_part.function_call.args = {"query": "test"}
        mock_part.text = None
        mock_candidate.content = MagicMock(parts=[mock_part])

        # Second response (final)
        mock_final_candidate = MagicMock()
        mock_final_part = MagicMock()
        mock_final_part.function_call = None
        mock_final_part.text = '{"assistant_message": "Error happened", "reasoning_trace": "...", "chat_summary_update": "...", "user_profile_update": "..."}'
        mock_final_candidate.content = MagicMock(parts=[mock_final_part])

        agent.client.models.generate_content.side_effect = [MagicMock(candidates=[mock_candidate]), MagicMock(candidates=[mock_final_candidate])]

        # Mock tool registry to return a failure
        with patch("app.domains.chat.agent.registry.execute", new_callable=AsyncMock) as mock_execute:
            mock_execute.return_value = MagicMock(success=False, output=None, error="Connection timeout")

            # Mock _load_instruction to avoid file system calls
            with patch.object(ChatAgent, "_load_instruction", return_value="Test instruction"):
                # This should NOT raise ValidationError
                await agent.process_message("user", "chat", [], "test", "coding")

                # Verify generate_content was called with a dict in the tool response
                call_args = agent.client.models.generate_content.call_args_list[1]
                contents = call_args.kwargs["contents"]
                tool_content = contents[-1]
                assert tool_content.role == "tool"
                # In our fix, we wrapped it in {"error": "..."}
                assert tool_content.parts[0].function_response.response == {"error": "Connection timeout"}
