from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi_server.agent import startup, shutdown, run_agent
import base64
from pydantic import BaseModel
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

@app.post("/chat-img")
async def chat_img(image: UploadFile = File(None), message: str = Form(...)):
    try:
        base64_image = None
        if image:
            image_bytes = await image.read()
            base64_image = base64.b64encode(image_bytes).decode("utf-8")

        agent_input = []
        if message:
            agent_input.append({"type": "text", "text": message})
        if base64_image:
            agent_input.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{base64_image}",
                    "detail": "auto"
                }
            })

        response = await run_agent(agent_input)
        return {"response": str(response)}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


if __name__ == "__main__":
    uvicorn.run("fastapi_server.app:app", host="0.0.0.0", port=8000, reload=True)
