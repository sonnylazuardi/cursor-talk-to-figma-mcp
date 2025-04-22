# fastapi_server/agent.py
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain_openai import ChatOpenAI
from langchain_mcp_adapters.tools import load_mcp_tools
from langgraph.prebuilt import create_react_agent
from langchain.schema.messages import HumanMessage, AIMessage
from dotenv import load_dotenv
from pathlib import Path
import os

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

async def startup():
    global agent, session, stdio_context
    stdio_context = stdio_client(server_params)
    read, write = await stdio_context.__aenter__()
    session = await ClientSession(read, write).__aenter__()
    await session.initialize()
    tools = await load_mcp_tools(session)
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
