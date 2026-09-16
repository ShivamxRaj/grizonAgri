# Grizon Agri

> **"Talk to your farm."** — Voice-first agricultural AI for Indian farmers.

## Quick Start

### 1. Start Infrastructure (Docker)
```bash
docker compose up -d
```
This starts PostgreSQL (with pgvector) and Redis.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp ../.env.example ../.env   # Edit with your API keys
```

### 3. Run Backend Server
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup (Sprint 2)
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints
- `GET  /health` — Health check
- `POST /api/v1/chat/query` — Agricultural chat query
- `POST /api/v1/voice/transcribe` — Sarvam STT
- `POST /api/v1/voice/synthesize` — Sarvam TTS
- `GET  /api/v1/mandi/prices` — Mandi market prices
- `POST /api/v1/disease/scan` — Crop disease scanner

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** FastAPI + LangGraph + Python 3.11+
- **Database:** PostgreSQL 16 + pgvector
- **Cache:** Redis 7
- **Voice:** Sarvam AI (Saaras v3 + Bulbul v3)
- **LLM:** Groq Llama 3.1
