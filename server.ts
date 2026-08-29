import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Short in-memory cache to prevent spamming but allow fast updates
let cachedData: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 10 * 1000; // 10 seconds cache for near real-time updates

async function fetchFromAppsScript() {
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
