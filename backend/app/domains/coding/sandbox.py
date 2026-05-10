import asyncio
import logging
import os
import tempfile

logger = logging.getLogger("talos.sandbox")


class SandboxResult:
    def __init__(self, stdout: str, stderr: str, exit_code: int, timed_out: bool = False):
        self.stdout = stdout
        self.stderr = stderr
        self.exit_code = exit_code
        self.timed_out = timed_out

    @property
    def is_success(self) -> bool:
        return self.exit_code == 0 and not self.timed_out


class LocalSandbox:
    """
    A local subprocess-based sandbox for executing Python code.
    In a production environment, this would be replaced by a Docker-based executor.
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout

    async def run_code(self, code: str) -> SandboxResult:
        """
        Runs the provided Python code in a temporary file and returns the result.
        """
        with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as tmp:
            tmp.write(code)
            tmp_path = tmp.name

        try:
            process = await asyncio.create_subprocess_exec("python3", tmp_path, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)

            try:
                stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=self.timeout)
                return SandboxResult(stdout=stdout.decode(), stderr=stderr.decode(), exit_code=process.returncode)
            except TimeoutError:
                try:
                    process.kill()
                except ProcessLookupError:
                    pass
                return SandboxResult(stdout="", stderr="Execution timed out.", exit_code=-1, timed_out=True)

        except Exception as e:
            return SandboxResult(stdout="", stderr=str(e), exit_code=-1)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
