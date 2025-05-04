from typing import Optional
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain_openai import ChatOpenAI
from langchain_mcp_adapters.tools import load_mcp_tools
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import BaseTool
from langchain.schema.messages import HumanMessage, AIMessage
from dotenv import load_dotenv
from pathlib import Path
import os
import re
import json
load_dotenv()

model = ChatOpenAI(model="gpt-4o")

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = str(Path(current_dir).parent)

server_params = StdioServerParameters(
    command="node",
    args=[f"{parent_dir}/talk_to_figma_mcp/dist/server.js"],
)

# Global references for reuse
agent = None
session = None
stdio_context = None
tool_dict = {}
root_frame_id: Optional[str] = None

async def startup():
    global agent, session, stdio_context, tool_dict
    stdio_context = stdio_client(server_params)
    read, write = await stdio_context.__aenter__()
    session = await ClientSession(read, write).__aenter__()
    await session.initialize()
    tools = await load_mcp_tools(session)
    tool_dict = {tool.name: tool for tool in tools if isinstance(tool, BaseTool)}
    agent = create_react_agent(model, tools)

async def shutdown():
    global session, stdio_context
    if session:
        await session.__aexit__(None, None, None)
    if stdio_context:
        await stdio_context.__aexit__(None, None, None)

async def run_agent(user_input: list):
    global agent

    human_message = HumanMessage(content=user_input)
    return await agent.ainvoke({"messages": [human_message]})

async def call_tool(tool_name: str, args: dict = {}):
    global tool_dict, root_frame_id
    try:
        if tool_name not in tool_dict:
            return {"status": "error", "message": f"Tool '{tool_name}' not found"}
        tool = tool_dict[tool_name]
        result = await tool.ainvoke(args)

        if isinstance(result, str):
            if tool_name == "create_frame":
                match = re.search(r'ID:\s*([a-zA-Z0-9:]+)', result)
                if match:
                    created_frame_id = match.group(1)
                    if root_frame_id is None:
                        root_frame_id = created_frame_id
            return {"status": "success", "data": result, "root_frame_id": root_frame_id}

        return {"status": "success", "data": result, }
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

# TODO: Remove this function after testing to integrate with run_agent
async def run_agent_with_image(text: str, base64_image: str):
    global agent
    message = [
        AIMessage(
            content="You are a helpful assistant skilled at designing UI/UX."
        ),
        HumanMessage(
            content=[
                {"type": "text", "text": text},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{base64_image}",
                        "detail": "auto"
                    }
                }
            ]
        )
    ]
    response = await agent.ainvoke({"messages": message})
    return response.content
