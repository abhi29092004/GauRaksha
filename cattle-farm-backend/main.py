from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from database import Base, engine
from routers import health, vet, milk, finance

Base.metadata.create_all(bind=engine)

# ── FastAPI app ───────────────────────────────────────────────
app = FastAPI(
    title="Cattle Farm Management API",
    description="AI-Based Smart Cattle Farm System — 4 Modules",
    version="1.0.0",
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(health.router,  prefix="/api/health",  tags=["Module 1 — Health"])
app.include_router(vet.router,     prefix="/api/vet",     tags=["Module 2 — Vet"])
app.include_router(milk.router,    prefix="/api/milk",    tags=["Module 3 — Milk"])
app.include_router(finance.router, prefix="/api/finance", tags=["Module 4 — Finance"])

# ── Socket.IO ─────────────────────────────────────────────────
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=False,
)
socket_app = socketio.ASGIApp(sio, app, socketio_path="/socket.io")

@sio.event
async def connect(sid, environ, auth=None):
    print(f"[Socket.IO] Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"[Socket.IO] Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    room = data.get("room", "default")
    await sio.enter_room(sid, room)
    await sio.emit("system_message", {"text": f"Connected to room: {room}"}, room=room)
    print(f"[Socket.IO] {sid} joined room: {room}")

@sio.event
async def chat_message(sid, data):
    room = data.get("room", "default")
    await sio.emit("chat_message", {
        "sender":    data.get("sender", "User"),
        "text":      data.get("text", ""),
        "timestamp": data.get("timestamp", ""),
    }, room=room)

@app.get("/")
def root():
    return {"status": "running", "docs": "/docs"}

@app.get("/health-check")
def health_check():
    return {"status": "ok", "socket_io": "mounted"}
# Run: uvicorn main:socket_app --reload --port 8000