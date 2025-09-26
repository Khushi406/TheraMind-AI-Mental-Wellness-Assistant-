# Flask service (optional)

## Overview

- The Node server implements /api/analyze, /api/prompt, /api/history by default.
- If you prefer using Python/Flask for AI endpoints, run a separate Flask service and set FLASK_URL for the Node server. The Node routes will proxy when FLASK_URL is set and healthy.

## Local (Windows) quick start

1) Create venv and install deps

```bat
py -3.11 -m venv .venv
.\.venv\Scripts\activate
python -m pip install -U pip
pip install cryptography flask flask-cors python-dotenv requests
```

1) Environment

```bat
set FLASK_ENV=development
set HUGGINGFACE_API_KEY=your_hf_key
```

1) Run Flask

```bat
python server\flask_app.py
```

## Production (Railway)

- Create a new service from this repo or a subpath that uses the `server` folder.
- Start command (example) uses Railway-provided $PORT:

```bash
gunicorn -w 2 -b 0.0.0.0:$PORT wsgi:application
```

- Environment variables: HUGGINGFACE_API_KEY.
- In the Node service, set FLASK_URL to the Flask service URL (e.g., <https://your-flask-service.up.railway.app>).
- The Node server will proxy /api/analyze, /api/prompt, /api/history to FLASK_URL if reachable; otherwise it falls back to local Node implementations.
