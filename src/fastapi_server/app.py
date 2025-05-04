from fastapi import FastAPI, Request, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from fastapi_server.agent import startup, shutdown, run_agent, call_tool
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
    from fastapi_server.agent import root_frame_id
    try:
        base64_image = None
        if image:
            image_bytes = await image.read()
            base64_image = base64.b64encode(image_bytes).decode("utf-8")

        agent_input = []
        if message:
            system_prefix = f"Use frame ID {root_frame_id} as the parentId for all elements.\n"
            full_message = system_prefix + message
            agent_input.append({"type": "text", "text": full_message})
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

@app.post("/tool/get_selection")
async def get_selection():
    result = await call_tool("get_selection")
    return result

@app.post("/tool/create_frame")
async def create_frame_endpoint(
    x: int = Query(0),
    y: int = Query(0),
    width: int = Query(...),
    height: int = Query(...),
    name: str = Query("Frame")
):
    result = await call_tool("create_frame", {
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "name": name,
        "fillColor": {"r": 1, "g": 1, "b": 1, "a": 1}
    })
    return result

@app.post("/tool/create_text_in_root_frame")
async def create_text_in_root_frame():
    from fastapi_server.agent import call_tool, root_frame_id

    if not root_frame_id:
        return {"status": "error", "message": "No root_frame_id set. Please call /tool/create_frame first."}

    result = await call_tool("create_text", {
        "parentId": root_frame_id,
        "x": 100,
        "y": 100,
        "text": "Hello in root!"
    })
    return result

if __name__ == "__main__":
    uvicorn.run("fastapi_server.app:app", host="0.0.0.0", port=8000, reload=True)