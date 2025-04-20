# Create server parameters for stdio connection
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage, AIMessage
from langchain_mcp_adapters.tools import load_mcp_tools
from langgraph.prebuilt import create_react_agent
from dotenv import load_dotenv
import asyncio

from langchain_openai import ChatOpenAI
import os
from pathlib import Path

load_dotenv()
model = ChatOpenAI(model="gpt-4o")
# Get the directory
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = str(Path(current_dir).parent)


server_params = StdioServerParameters(
    command="node",
    # Make sure to update to the full absolute path to your math_server.py file
    args=[f"{parent_dir}/talk_to_figma_mcp/dist/server.js"],
)

def format_agent_chat(agent_response):
  """Format the agent response into a readable conversation with colors."""
  # ANSI color codes
  BLUE = "\033[94m"       # Human messages
  GREEN = "\033[92m"      # AI messages
  YELLOW = "\033[93m"     # Tool names/calls
  CYAN = "\033[96m"       # Tool results
  BOLD = "\033[1m"        # Bold text
  RESET = "\033[0m"       # Reset formatting
  
  if not agent_response or 'messages' not in agent_response:
    return f"{YELLOW}No valid response data{RESET}"
  
  messages = agent_response['messages']
  formatted_output = [f"{BOLD}===== CONVERSATION ====={RESET}"]
  
  for message in messages:
    if isinstance(message, HumanMessage):
      formatted_output.append(f"{BLUE}{BOLD}Human:{RESET}{BLUE} {message.content}{RESET}")
    
    elif isinstance(message, AIMessage):
      # Check for tool calls
      if hasattr(message, 'tool_calls') and message.tool_calls:
        formatted_output.append(f"{GREEN}{BOLD}AI:{RESET}{GREEN} I'll help with that.{RESET}")
        for tool_call in message.tool_calls:
          tool_name = tool_call.get('name')
          args = tool_call.get('args')
          formatted_output.append(f"{YELLOW}[Tool Call] {BOLD}{tool_name}{RESET}{YELLOW} with args: {args}{RESET}")
      # Handle content response
      elif message.content:
        formatted_output.append(f"{GREEN}{BOLD}AI:{RESET}{GREEN} {message.content}{RESET}")
        
    elif isinstance(message, ToolMessage):
      formatted_output.append(f"{CYAN}{BOLD}[Tool Result] {message.name}:{RESET}{CYAN} {message.content}{RESET}")
    
    # Add separator between different messages
    formatted_output.append(f"{BOLD}{'─' * 40}{RESET}")
  
  return "\n".join(formatted_output)


# Define an async function
async def main():
  async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
      # Initialize the connection
      await session.initialize()

      # Get tools
      tools = await load_mcp_tools(session)

      # Create the agent
      agent = create_react_agent(model, tools)
      
      print("Welcome to Figma Assistant! Type 'exit' or 'quit' to end the session.")
      
      while True:
        # Get input from the terminal
        user_input = input("\nYour question: ")
        
        # Check if user wants to exit
        if user_input.lower() in ["exit", "quit"]:
          break
        
        print(f"\nProcessing: {user_input}")
        
        # Run the agent with the user input
        agent_response = await agent.ainvoke({"messages": user_input})
        
        # Print the formatted response
        print(format_agent_chat(agent_response))


# Run the async function
if __name__ == "__main__":
  asyncio.run(main())