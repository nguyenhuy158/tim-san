"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Court = {
  id: string;
  name: string;
  sport: string;
  address: string;
  ward: string;
  distanceKm: number;
  rating: number;
  open: string;
  close: string;
  available: string[];
  accent: string;
};

const COURTS: Court[] = [
  {
    id: "usc-pickleball-binh-trung-dong",
    name: "USC Pickleball Bình Trưng Đông",
    sport: "Pickleball",
    address: "Số 04 đường 51, phường Bình Trưng Đông, TP.HCM",
    ward: "Bình Trưng Đông",
    distanceKm: 1.8,
    rating: 4.9,
    open: "05:00",
    close: "22:00",
    available: ["06:00", "07:30", "09:00", "18:00", "19:30"],
    accent: "mint",
  },
  {
    id: "clb-cau-long-dong-phuong",
    name: "CLB Cầu Lông Đông Phương",
    sport: "Cầu lông",
    address: "873 đường số 47, phường Bình Trưng Đông, TP.HCM",
    ward: "Bình Trưng Đông",
    distanceKm: 2.2,
    rating: 5,
    open: "05:00",
    close: "23:00",
    available: ["05:30", "08:00", "10:30", "17:00", "20:00"],
    accent: "coral",
  },
  {
    id: "nha-van-hoa-lao-dong",
    name: "Sân Cầu Lông Nhà Văn hóa Lao động",
    sport: "Cầu lông",
    address: "245 Nguyễn Duy Trinh, phường Bình Trưng, TP.HCM",
    ward: "Bình Trưng",
    distanceKm: 2.7,
    rating: 4.8,
    open: "05:00",
    close: "23:00",
    available: ["06:30", "08:30", "14:00", "18:30", "21:00"],
    accent: "blue",
  },
  {
    id: "the-kitchen-zone-pickleball",
    name: "The Kitchen Zone - Pickleball",
    sport: "Pickleball",
    address: "32 Đồng Văn Cống, phường Bình Trưng Tây, TP.HCM",
    ward: "Bình Trưng Tây",
    distanceKm: 3.1,
    rating: 5,
    open: "06:00",
    close: "24:00",
    available: ["06:00", "09:00", "16:30", "19:00", "21:30"],
    accent: "violet",
  },
];

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
const FILTER_OPTIONS = [
  { id: "badminton", label: "Cầu lông", group: "sport" },
  { id: "pickleball", label: "Pickleball", group: "sport" },
  { id: "time-18-19", label: "18:00–19:00", group: "time" },
  { id: "time-18-20", label: "18:00–20:00", group: "time" },
  { id: "weekdays", label: "Thứ 2–Thứ 6", group: "days" },
];

export default function Home() {
  const [query, setQuery] = useState("Bình Trưng");
  const [date, setDate] = useState("2026-07-15");
  const [sport, setSport] = useState("Tất cả môn");
  const [time, setTime] = useState("19:00");
  const [endTime, setEndTime] = useState("20:00");
  const [weekdayPreset, setWeekdayPreset] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<string[][]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem("tim-san-saved-filters");
    return stored ? JSON.parse(stored) : [];
  });
  const [searched, setSearched] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [apiResults, setApiResults] = useState<Court[] | null>(null);

  useEffect(() => {
    if (!apiBase) return;
    const params = new URLSearchParams({ query, date, sport, start_time: time, end_time: endTime });
    fetch(`${apiBase}/api/search?${params}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("API unavailable")))
      .then((payload: { results?: Court[] }) => setApiResults(payload.results ?? []))
      .catch(() => setApiResults(null));
  }, [query, date, sport, time, endTime]);

  const localResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return COURTS.filter((court) => {
      const matchesQuery = !normalized || `${court.name} ${court.address}`.toLowerCase().includes(normalized);
      const matchesSport = sport === "Tất cả môn" || court.sport === sport;
      const rangeSelected = selectedFilters.some((item) => item.startsWith("time-"));
      const start = Number(time.replace(":", ""));
      const end = Number(endTime.replace(":", ""));
      const hasSlot = !rangeSelected || court.available.some((slot) => {
        const value = Number(slot.replace(":", ""));
        return value >= start && value <= end;
      });
      return matchesQuery && matchesSport && hasSlot;
    });
  }, [query, sport, time, endTime, selectedFilters]);
  const results = apiResults ?? localResults;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearched(true);
  }

  function toggleFavorite(id: string) {
    setFavoriteIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function applyWeekdayPreset(nextEndTime: string) {
    setSport("Cầu lông");
    setTime("18:00");
    setEndTime(nextEndTime);
    setWeekdayPreset(nextEndTime);
    setSelectedFilters(["badminton", nextEndTime === "19:00" ? "time-18-19" : "time-18-20", "weekdays"]);
  }

  function applySavedFilter(filter: string[]) {
    setSelectedFilters(filter);
    const hasBadminton = filter.includes("badminton");
    const hasPickleball = filter.includes("pickleball");
    const range = filter.includes("time-18-19") ? "19:00" : filter.includes("time-18-20") ? "20:00" : "";
    setSport(hasBadminton ? "Cầu lông" : hasPickleball ? "Pickleball" : "Tất cả môn");
    if (range) { setTime("18:00"); setEndTime(range); }
    setWeekdayPreset(filter.includes("weekdays") ? range : "");
  }

  function toggleFilter(id: string) {
    const option = FILTER_OPTIONS.find((item) => item.id === id);
    if (!option) return;
    setSelectedFilters((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current.filter((item) => FILTER_OPTIONS.find((filter) => filter.id === item)?.group !== option.group), id];
      setSport(next.includes("badminton") ? "Cầu lông" : next.includes("pickleball") ? "Pickleball" : "Tất cả môn");
      if (id.startsWith("time-")) {
        setTime("18:00");
        setEndTime(id === "time-18-19" ? "19:00" : "20:00");
      }
      setWeekdayPreset(next.includes("weekdays") ? (next.includes("time-18-19") ? "19:00" : next.includes("time-18-20") ? "20:00" : "") : "");
      return next;
    });
  }

  function saveCurrentFilter() {
    if (!selectedFilters.length) return;
    const next = [...savedFilters.filter((item) => item.join(",") !== selectedFilters.join(",")), selectedFilters];
    setSavedFilters(next);
    window.localStorage.setItem("tim-san-saved-filters", JSON.stringify(next));
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-topline">
          <div className="brand-mark">TS</div>
          <span className="status-pill"><span /> API live-ready</span>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">TIM SAN / QUICK COURT FINDER</p>
          <h1>Tìm sân trống,<br /><em>chốt lịch nhanh.</em></h1>
          <p className="hero-description">Một nơi gọn gàng để tìm sân thể thao quanh bạn và biết ngay khung giờ còn trống.</p>
        </div>
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
      </section>

      <section className="search-panel" aria-label="Bộ lọc tìm sân">
        <form onSubmit={submit}>
          <label className="field field-wide">
            <span>Khu vực hoặc tên sân</span>
            <div className="input-wrap"><span className="input-icon">⌖</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ví dụ: Bình Trưng" /></div>
          </label>
          <label className="field">
            <span>Ngày chơi</span>
            <div className="input-wrap"><span className="input-icon">▣</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
          </label>
          <label className="field">
            <span>Môn thể thao</span>
            <div className="input-wrap"><span className="input-icon">◉</span><select value={sport} onChange={(event) => setSport(event.target.value)}><option>Tất cả môn</option><option>Pickleball</option><option>Cầu lông</option></select></div>
          </label>
          <label className="field">
            <span>Giờ bắt đầu</span>
            <div className="input-wrap"><span className="input-icon">◷</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></div>
          </label>
          <button className="search-button" type="submit"><span>⌕</span> Tìm sân</button>
        </form>
        <div className="quick-filters"><span>Lọc nhanh</span><button type="button" onClick={() => { setSport("Pickleball"); setWeekdayPreset(""); }}>Pickleball</button><button type="button" onClick={() => { setSport("Cầu lông"); setWeekdayPreset(""); }}>Cầu lông</button><button type="button" onClick={() => { setSport("Tất cả môn"); setWeekdayPreset(""); }}>Tất cả</button></div>
        <div className="filter-ticks"><span className="preset-label">Bộ lọc</span>{FILTER_OPTIONS.map((option) => <label className={`tick-filter ${selectedFilters.includes(option.id) ? "tick-active" : ""}`} key={option.id}><input type="checkbox" checked={selectedFilters.includes(option.id)} onChange={() => toggleFilter(option.id)} /><span>{option.label}</span></label>)}<button className="save-filter" type="button" onClick={saveCurrentFilter} disabled={!selectedFilters.length}>＋ Lưu bộ lọc</button></div>
        {savedFilters.length > 0 && <div className="saved-filters"><span className="preset-label">Đã lưu</span>{savedFilters.map((filter, index) => <button type="button" className="saved-filter" key={filter.join(",")} onClick={() => applySavedFilter(filter)}>Bộ lọc {index + 1} <span>↗</span></button>)}</div>}
        <div className="preset-row"><span className="preset-label">Preset hay dùng</span><button type="button" className={`preset ${weekdayPreset === "19:00" ? "preset-active" : ""}`} onClick={() => applyWeekdayPreset("19:00")}><span>🏸</span> Cầu lông · 18:00–19:00 <small>T2–T6</small></button><button type="button" className={`preset ${weekdayPreset === "20:00" ? "preset-active" : ""}`} onClick={() => applyWeekdayPreset("20:00")}><span>🏸</span> Cầu lông · 18:00–20:00 <small>T2–T6</small></button></div>
      </section>

      <section className="results-section">
        <div className="results-heading">
          <div><p className="eyebrow">KẾT QUẢ GỢI Ý</p><h2>{searched ? `${results.length} sân quanh ${query || "bạn"}` : "Sân gần bạn"}</h2></div>
          <button className="sort-button" type="button">Gần nhất <span>⌄</span></button>
        </div>
        <div className="result-grid">
          {results.map((court) => {
            const isFavorite = favoriteIds.includes(court.id);
            return <article className="court-card" key={court.id}>
              <div className={`court-visual ${court.accent}`}><span className="sport-badge">{court.sport}</span><button className={`favorite ${isFavorite ? "is-favorite" : ""}`} onClick={() => toggleFavorite(court.id)} aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"}>{isFavorite ? "♥" : "♡"}</button><div className="visual-lines" /><span className="visual-index">0{results.indexOf(court) + 1}</span></div>
              <div className="court-content"><div className="court-title-row"><div><h3>{court.name}</h3><p className="address">{court.address}</p></div><span className="rating">★ {court.rating.toFixed(1)}</span></div><div className="court-meta"><span>◷ {court.open} – {court.close}</span><span>⌖ {court.distanceKm.toFixed(1)} km</span></div><div className="slot-row"><span className="slot-label">Còn trống</span>{court.available.filter((slot) => { if (!selectedFilters.some((item) => item.startsWith("time-"))) return true; const value = Number(slot.replace(":", "")); return value >= Number(time.replace(":", "")) && value <= Number(endTime.replace(":", "")); }).slice(0, 3).map((slot) => <button className={`slot ${slot === time ? "slot-selected" : ""}`} key={slot} onClick={() => setTime(slot)}>{slot}</button>)}<span className="more-slots">{weekdayPreset ? "T2–T6" : `+${Math.max(0, court.available.length - 3)}`}</span></div><button className="book-button" type="button">Xem lịch sân <span>↗</span></button></div>
            </article>;
          })}
        </div>
        {results.length === 0 && <div className="empty-state"><div>⌖</div><h3>Chưa thấy sân phù hợp</h3><p>Thử tìm bằng tên phường khác hoặc chọn “Tất cả môn”.</p></div>}
      </section>

      <footer><span>tim-san</span><span>Backend Python · Frontend React</span><span>{apiBase ? "Connected to API" : "Demo data · sẵn sàng nối API"}</span></footer>
    </main>
  );
}
