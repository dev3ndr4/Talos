from pydantic import Field

from app.core.tools.base import BaseTool
from app.domains.coding.sandbox import LocalSandbox

sandbox = LocalSandbox()


class ExecutePython(BaseTool):
    """
    Executes Python code in a secure sandbox and returns the stdout and stderr.
    Use this for calculations, data processing, or verifying code logic.
    """

    code: str = Field(..., description="The Python code to execute.")

    async def run(self) -> dict:
        result = await sandbox.run_code(self.code)
        return {"stdout": result.stdout, "stderr": result.stderr, "exit_code": result.exit_code, "success": result.is_success, "timed_out": result.timed_out}
