# tim-san backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The React app can point to it with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.
