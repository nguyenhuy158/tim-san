"""Python API for tim-san.

The upstream API is intentionally kept behind this service so the React app
does not need to know the provider's request format or credentials.
"""

from datetime import date
from typing import Any

import httpx
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

UPSTREAM = "https://user-global.alobo.vn/v2/user/branch"

COURTS = [
    {"id": "usc-pickleball-binh-trung-dong", "name": "USC Pickleball Bình Trưng Đông", "sport": "Pickleball", "address": "Số 04 đường 51, phường Bình Trưng Đông, TP.HCM", "ward": "Bình Trưng Đông", "distanceKm": 1.8, "rating": 4.9, "open": "05:00", "close": "22:00", "available": ["06:00", "07:30", "09:00", "18:00", "19:30"]},
    {"id": "clb-cau-long-dong-phuong", "name": "CLB Cầu Lông Đông Phương", "sport": "Cầu lông", "address": "873 đường số 47, phường Bình Trưng Đông, TP.HCM", "ward": "Bình Trưng Đông", "distanceKm": 2.2, "rating": 5, "open": "05:00", "close": "23:00", "available": ["05:30", "08:00", "10:30", "17:00", "20:00"]},
    {"id": "nha-van-hoa-lao-dong", "name": "Sân Cầu Lông Nhà Văn hóa Lao động", "sport": "Cầu lông", "address": "245 Nguyễn Duy Trinh, phường Bình Trưng, TP.HCM", "ward": "Bình Trưng", "distanceKm": 2.7, "rating": 4.8, "open": "05:00", "close": "23:00", "available": ["06:30", "08:30", "14:00", "18:30", "21:00"]},
    {"id": "the-kitchen-zone-pickleball", "name": "The Kitchen Zone - Pickleball", "sport": "Pickleball", "address": "32 Đồng Văn Cống, phường Bình Trưng Tây, TP.HCM", "ward": "Bình Trưng Tây", "distanceKm": 3.1, "rating": 5, "open": "06:00", "close": "24:00", "available": ["06:00", "09:00", "16:30", "19:00", "21:30"]},
]

app = FastAPI(title="tim-san API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/search")
async def search(
    q: str = Query("", alias="query"),
    sport: str = "",
    on: date | None = Query(None),
    start_time: str = "",
) -> dict[str, Any]:
    """Return local cache results; live upstream sync can be added here safely."""
    normalized = q.strip().casefold()
    matches = [
        court for court in COURTS
        if (not normalized or normalized in f"{court['name']} {court['address']}".casefold())
        and (not sport or sport == "Tất cả môn" or court["sport"] == sport)
    ]
    return {"query": q, "date": str(on) if on else None, "startTime": start_time, "count": len(matches), "results": matches, "source": "cache"}


@app.get("/api/upstream/branch/{branch_id}/schedule")
async def schedule(branch_id: str, month: str = Query(..., pattern=r"^\d{4}-\d{2}$")) -> dict[str, Any]:
    """Proxy the public recurring-booking endpoint for a known branch."""
    url = f"{UPSTREAM}/get_schedule_bookings"
    async with httpx.AsyncClient(timeout=12) as client:
        response = await client.get(url, params={"branchId": branch_id, "month": month})
        response.raise_for_status()
        return response.json()


@app.get("/api/upstream/branch/{branch_id}/bookings")
async def one_time_bookings(branch_id: str, start_date: date, end_date: date) -> Any:
    url = f"{UPSTREAM}/get_onetime_bookings"
    async with httpx.AsyncClient(timeout=12) as client:
        response = await client.get(url, params={"branchId": branch_id, "startDate": start_date, "endDate": end_date})
        response.raise_for_status()
        return response.json()
