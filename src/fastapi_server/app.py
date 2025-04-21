from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi_server.agent import startup, shutdown, run_agent
import uvicorn

app = FastAPI(lifespan=lambda app: lifespan_context())

class ChatRequest(BaseModel):
    message: str

# Define lifespan context
from contextlib import asynccontextmanager
@asynccontextmanager
async def lifespan_context():
    await startup()
    yield
    await shutdown()

@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        response = await run_agent(req.message)
        return {"response": str(response)}
    except Exception as e:
        return {"response": f"Error: {str(e)}"}


if __name__ == "__main__":
    uvicorn.run("fastapi_server.app:app", host="0.0.0.0", port=8000, reload=True)
