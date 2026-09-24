import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from tracker.ingestion import run_ais_ingestion

class Broadcaster:
    def __init__(self):
        self.active_clients: list[WebSocket] = []

    async def register(self, ws: WebSocket):
        await ws.accept()
        self.active_clients.append(ws)

    def unregister(self, ws: WebSocket):
        if ws in self.active_clients:
            self.active_clients.remove(ws)

    async def broadcast(self, data: dict):
        for client in self.active_clients[:]:
            try:
                await client.send_json(data)
            except Exception:
                self.unregister(client)

broadcaster = Broadcaster()
broadcast_queue = asyncio.Queue()

async def dispatcher_task():
    """Pulls points from the ingestion queue and broadcasts to all connected frontends."""
    while True:
        data = await broadcast_queue.get()
        await broadcaster.broadcast(data)
        broadcast_queue.task_done()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Launch background worker tasks alongside server
    task_dispatch = asyncio.create_task(dispatcher_task())
    task_ingestion = asyncio.create_task(run_ais_ingestion(broadcast_queue))
    yield
    task_dispatch.cancel()
    task_ingestion.cancel()

app = FastAPI(title="AIS Live Stream & Trajectory Filter PoC", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/ais")
async def websocket_endpoint(ws: WebSocket):
    await broadcaster.register(ws)
    try:
        while True:
            await ws.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        broadcaster.unregister(ws)

# Serve local test map UI
app.mount("/", StaticFiles(directory="demo_ui", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)