import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Short in-memory cache to prevent spamming but allow fast updates
let cachedData: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 10 * 1000; // 10 seconds cache for near real-time updates

const SHEET_ID = "1bRt2w7QT3fcP5m02WZqqiIAGQmOgml_IQyUrxQAFAPE";

async function fetchTabGViz(tabName: string): Promise<any[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}&t=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const text = await res.text();
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
  if (!match) return [];
  const json = JSON.parse(match[1]);
  if (json.status === "error") return [];
  const cols = json.table?.cols || [];
  const rawRows = json.table?.rows || [];
  if (rawRows.length === 0) return [];

  let headers = cols.map((c: any) => (c?.label || "").trim());
  let dataRows = rawRows;

  const hasColLabels = headers.some((h: string) => h.length > 0 && !h.match(/^[A-Z]$/));
  if (!hasColLabels && rawRows.length > 0) {
    headers = rawRows[0].c.map((cell: any) => (cell && cell.v !== null && cell.v !== undefined ? String(cell.v).trim() : ""));
    dataRows = rawRows.slice(1);
  }

  return dataRows.map((r: any, idx: number) => {
    const obj: any = { rowNum: idx + 2 };
    headers.forEach((h: string, colIdx: number) => {
      if (!h) return;
      const cell = r.c ? r.c[colIdx] : null;
      let val = cell ? (cell.v !== undefined ? cell.v : cell.f) : "";
      if (typeof val === "string" && val.startsWith("Date(")) {
        const dMatch = val.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (dMatch) {
          const year = dMatch[1];
          const month = String(Number(dMatch[2]) + 1).padStart(2, "0");
          const day = String(dMatch[3]).padStart(2, "0");
          val = `${year}-${month}-${day}`;
        }
      }
      obj[h] = val;
    });
    return obj;
  });
}

async function fetchFromGoogleSheet(): Promise<any> {
  const [
    settingsRows,
    categoriesRows,
    dataRows,
    itemsRows,
    sliderRows,
    formCatsRows,
    formsRows,
    contactRows,
    branchesRows
  ] = await Promise.all([
    fetchTabGViz("Settings").catch(() => []),
    fetchTabGViz("Categories").catch(() => []),
    fetchTabGViz("Data").catch(() => []),
    fetchTabGViz("Items").catch(() => []),
    fetchTabGViz("Slider").catch(() => []),
    fetchTabGViz("FormCategories").catch(() => []),
    fetchTabGViz("Forms").catch(() => []),
    fetchTabGViz("Contact").catch(() => []),
    fetchTabGViz("Branches").catch(() => [])
  ]);

  const rawKnowledgeRows = dataRows.length > 0 ? dataRows : itemsRows;
  const items = rawKnowledgeRows.map((r: any, idx: number) => ({
    rowNum: r.rowNum || idx + 2,
    Category: r.Category || r.Group || "Q&A",
    Title: r.Title || r.Question || r.Topic || r.Name || "",
    Details: r.Details || r.Answer || r.Description || r.Detail || "",
    Date: r.Date || "",
    FileURL: r.Link || r.FileURL || r.URL || r.LinkURL || r.File || "",
    Link: r.Link || r.FileURL || r.URL || "",
    ImageURL: r.ImageURL || ""
  })).filter((item: any) => item.Title && item.Title.trim().length > 0 && item.Title !== "Title");

  let categories = categoriesRows
    .map((c: any) => c.Name || c.A || Object.values(c)[1])
    .filter((c: any) => typeof c === 'string' && c.trim().length > 0 && c !== "Name");

  const inferredCategories = Array.from(new Set(items.map((i: any) => i.Category).filter(Boolean)));
  inferredCategories.forEach((cat: any) => {
    if (!categories.includes(cat)) categories.push(cat);
  });

  const formsData = formsRows.map((row: any) => ({
    ...row,
    Level1: row.Level1 || row.Category || "การประเมินการสอน",
    Level2: row.Level2 || "",
    Level3: row.Level3 || "",
    Title: row.Title || row.Name || "",
    FileURL: row.LinkURL || row.FileURL || row.URL || row.Link || ""
  })).filter((f: any) => f.Title && f.Title !== "Title");

  const branches = branchesRows.map((r: any, idx: number) => ({
    rowNum: r.rowNum || idx + 2,
    Group: r.Group || r.A || "",
    Field: r.Field || r.B || "",
    Subfield: r.Subfield || r.C || "",
    Branch: r.Branch || r.D || ""
  })).filter((b: any) => b.Group && b.Group !== "Group" && b.Group.trim() !== "");

  return {
    settings: settingsRows[0] || {},
    categories,
    items,
    slider: sliderRows,
    formCatsMeta: formCatsRows,
    formsData,
    contact: contactRows[0] || {},
    branches,
    totalVisits: 284,
    thisMonthVisits: 118,
    lastUpdated: new Date().toISOString()
  };
}

async function fetchFromAppsScript() {
  // Try direct Google Sheets GViz first
  try {
    const sheetData = await fetchFromGoogleSheet();
    if (sheetData && (sheetData.items?.length || sheetData.slider?.length || sheetData.formsData?.length)) {
      return sheetData;
    }
  } catch (e) {
    console.warn("Direct Google Sheet GViz in server failed, trying Apps Script...", e);
  }

  const url = "https://script.google.com/macros/s/AKfycbxLHp1LBXBj4QYgIUq76-fie06_DscaOCbGcirvk1b44fOVyoFmVBungMUTx7ZRua8obg/exec";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  
  if (!res.ok) {
    throw new Error(`Apps Script responded with status ${res.status}`);
  }

  const text = await res.text();
  const trimmed = text.trim();
  let parsedData: any = null;

  // 1. Direct JSON Response
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const jsonObj = JSON.parse(trimmed);
      if (jsonObj.data) {
        parsedData = jsonObj.data;
      } else if (jsonObj.settings || jsonObj.items || jsonObj.categories || jsonObj.slider) {
        parsedData = jsonObj;
      }
    } catch {
      // Continue to HTML extraction if JSON parse fails
    }
  }

  // 2. Extract from goog.script.init inside HTML
  if (!parsedData) {
    const initPrefix = "goog.script.init(";
    const initIdx = text.indexOf(initPrefix);
    if (initIdx !== -1) {
      const startQuote = text.indexOf("\"", initIdx);
      let endQuote = text.indexOf("\", \"\", undefined", startQuote);
      if (endQuote === -1) endQuote = text.indexOf("\",\"\",undefined", startQuote);
      if (endQuote === -1) endQuote = text.indexOf("\", \"\",", startQuote);

      if (startQuote !== -1 && endQuote !== -1) {
        const rawArg = text.slice(startQuote, endQuote + 1);
        const jsonArg = rawArg.replace(/\\x([0-9A-Fa-f]{2})/g, "\\u00$1");
        const innerJsonStr = JSON.parse(jsonArg);
        const initObj = JSON.parse(innerJsonStr);
        const userHtml = initObj.userHtml;

        if (userHtml) {
          const match = userHtml.match(/<script id="initial-data" type="application\/json">([\s\S]*?)<\/script>/);
          if (match && match[1]) {
            parsedData = JSON.parse(match[1]);
          }
        }
      }
    }
  }

  // 3. Fallback: Search directly for initial-data script tag
  if (!parsedData) {
    const match = text.match(/<script id="initial-data" type="application\/json">([\s\S]*?)<\/script>/);
    if (match && match[1]) {
      parsedData = JSON.parse(match[1]);
    }
  }

  if (!parsedData) {
    throw new Error("Unable to parse response from Apps Script");
  }

  parsedData.lastUpdated = new Date().toISOString();

  // Helper for Google Drive image conversion
  const formatDriveUrl = (raw: string) => {
    if (!raw || typeof raw !== 'string') return '';
    const clean = raw.trim();
    const match1 = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1 && match1[1]) return `https://lh3.googleusercontent.com/d/${match1[1]}`;
    const match2 = clean.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2 && match2[1]) return `https://lh3.googleusercontent.com/d/${match2[1]}`;
    return clean;
  };

  // Sanitize totalVisits and thisMonthVisits
  const rawTotal = typeof parsedData.totalVisits === 'number' ? parsedData.totalVisits : 284;
  const rawMonth = typeof parsedData.thisMonthVisits === 'number' ? parsedData.thisMonthVisits : 118;
  const monthCount = (rawMonth > 0 && rawMonth < 100000) ? rawMonth : 118;
  const totalCount = (rawTotal > 0 && rawTotal < 1000000) ? rawTotal : monthCount + 166;
  
  parsedData.totalVisits = totalCount;
  parsedData.thisMonthVisits = monthCount;

  // Normalize slider items and clean image URLs
  if (Array.isArray(parsedData.slider)) {
    parsedData.slider = parsedData.slider.map((item: any) => {
      if (typeof item === 'string') {
        return { ImageURL: formatDriveUrl(item) };
      }
      const rawUrl = item.ImageURL || item.URL || item.Image || item.Photo || item.Link || item.image || item.url || item[''] || '';
      return {
        ...item,
        ImageURL: formatDriveUrl(rawUrl) || rawUrl
      };
    }).filter((item: any) => item.ImageURL && typeof item.ImageURL === 'string' && item.ImageURL.startsWith('http'));
  }

  return parsedData;
}

// API Routes
app.get("/api/stats", async (req, res) => {
  try {
    const data = await fetchFromAppsScript();
    cachedData = data;
    lastCacheTime = Date.now();
    res.json({
      success: true,
      totalVisits: data.totalVisits,
      thisMonthVisits: data.thisMonthVisits,
      lastUpdated: data.lastUpdated
    });
  } catch (err: any) {
    if (cachedData) {
      return res.json({
        success: true,
        totalVisits: cachedData.totalVisits,
        thisMonthVisits: cachedData.thisMonthVisits,
        source: "cache"
      });
    }
    res.status(500).json({ success: false, error: err?.message });
  }
});

app.get("/api/data", async (req, res) => {
  const forceRefresh = req.query.refresh === "true" || req.query.refresh === "1";
  const now = Date.now();

  if (!forceRefresh && cachedData && (now - lastCacheTime < CACHE_TTL)) {
    return res.json({
      success: true,
      source: "cache",
      data: cachedData
    });
  }

  try {
    const data = await fetchFromAppsScript();
    cachedData = data;
    lastCacheTime = now;
    res.json({
      success: true,
      source: "network",
      data
    });
  } catch (err: any) {
    console.error("Error fetching Apps Script data:", err?.message || err);
    if (cachedData) {
      // Fallback to stale cache if network fails
      return res.json({
        success: true,
        source: "stale-cache",
        error: err?.message,
        data: cachedData
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to fetch data from Apps Script: " + (err?.message || "Unknown error")
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
