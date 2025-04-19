import os
from typing import Tuple
from llama_stack_client import LlamaStackClient
from llama_stack_client.types import UserMessage
from .smolagents import LocalPythonInterpreter

class Model:
    def __init__(self):
        self.messages = []
        self.system_prompt = """You are a helpful research assistant. Your goal is to provide factual, well-cited responses to user queries. To assist in your task, you have the following tools you can call in plain python code, by wrapping within <run_code> and </run_code>:
<run_code>
read_file(path: str) -> str
# Reads the file at the given path and returns its contents as a string.
</run_code>

<run_code>
write_file(path: str, content: str) -> str
# Writes the given content to the file at the given path.
# Returns the content of the file that was overwritten, if any, otherwise none.
</run_code>

<run_code>
research(query: str, goal: str) -> str
# Begins an iterative research process that aims to find information on the goal, with the query being the first attempted search string.
# Returns a string summarizing the results of the research.
</run_code>

For each query, after using the tools to assist in finding the solution (if necessary), you should provide a final answer without any tool calls.

Example:
User: What is the average life expectancy in the US?
Assistant: Let me search for the average life expectancy in the US.
<run_code>
research("average life expectancy in the US", "life expectancy")
</run_code>
Tool response: The average life expectancy in the US is 78 years[Wikipedia](https://en.wikipedia.org/wiki/Life_expectancy).
Assistant: The average life expectancy in the US is 78 years[Wikipedia](https://en.wikipedia.org/wiki/Life_expectancy).
"""
        host = "localhost"
        port = 8321
        self.client = LlamaStackClient(
            base_url=f"http://{host}:{port}",
        )

    def chat(self, input:str = "") -> Tuple[bool, str]:
        if input != "":
            self.messages.append(input)
        new_message = self.send_request()
        print("LLM RESPONSE: " + new_message)
        self.messages.append(new_message)
        if "<run_code>" not in new_message and "</run_code>" not in new_message:
            print("TOOL HEADER FORMATTING ERROR")
            return True, new_message
        if "<run_code>" in new_message and "</run_code>" not in new_message:
            print("TOOL HEADER FORMATTING ERROR")
            self.messages.append("Malformed code tool, must wrap between <run_code> and </run_code>")
            return False, new_message
        if "<run_code>" not in new_message and "</run_code>" in new_message:
            print("TOOL HEADER FORMATTING ERROR")
            self.messages.append("Malformed code tool, must wrap between <run_code> and </run_code>")
            return False, new_message
        function_call = new_message.split("<run_code>")[1].split("</run_code>")[0]
        executable_tools = {}
        pythonInterpreter = LocalPythonInterpreter([], executable_tools)
        execution_result = pythonInterpreter(function_call, {})[0]
        print("TOOL RESPONSE: " + execution_result)
        print(execution_result)
        self.messages.append("```output:\n" + execution_result + "```")
        return False, new_message
    
    def read_file(path: str) -> str:
        if not os.path.exists(path):
            return "File not found"
        with open(path, "r") as f:
            return f.read()
        
    def write_file(path: str, content: str) -> str:
        if not os.path.exists(path):
            file_content = "None"
        else:
            with open(path, "r") as f:
                file_content = "Overwritten:\n" + f.read()
        with open(path, "w") as f:
            f.write(content)
        return file_content
    
    def research(query: str, goal: str) -> str:
        return "This is a test"
    
    def send_request(self):
        oai_messages = []
        oai_messages.append({"role": "system", "content": self.system_prompt})
        for i, msg in enumerate(self.messages):
            role = "user" if i % 2 == 0 else "assistant"
            oai_messages.append({"role": role, "content": msg})
        # send request to llamastack
        response = self.client.inference.chat_completion(
            messages=[
                oai_messages
            ],
            model_id="meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
            stream=False,
        )

        return response.completion_message.content