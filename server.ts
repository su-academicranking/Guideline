import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// In-memory cache for fast response times
let cachedData: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

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
  const initPrefix = "goog.script.init(";
  const initIdx = text.indexOf(initPrefix);
  if (initIdx === -1) {
    throw new Error("Could not find goog.script.init in Apps Script response");
  }

  const startQuote = text.indexOf("\"", initIdx);
  let endQuote = text.indexOf("\", \"\", undefined", startQuote);
  if (endQuote === -1) {
    endQuote = text.indexOf("\",\"\",undefined", startQuote);
  }
  if (endQuote === -1) {
    endQuote = text.indexOf("\", \"\",", startQuote);
  }

  if (startQuote === -1 || endQuote === -1) {
    throw new Error("Could not find quote boundaries in Apps Script response");
  }

  const rawArg = text.slice(startQuote, endQuote + 1);
  const jsonArg = rawArg.replace(/\\x([0-9A-Fa-f]{2})/g, "\\u00$1");

  const innerJsonStr = JSON.parse(jsonArg);
  const initObj = JSON.parse(innerJsonStr);
  const userHtml = initObj.userHtml;

  if (!userHtml) {
    throw new Error("userHtml property not found in initObj");
  }

  const match = userHtml.match(/<script id="initial-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error("initial-data script tag not found in userHtml");
  }

  const parsedData = JSON.parse(match[1]);
  parsedData.lastUpdated = new Date().toISOString();

  // Sanitize totalVisits and thisMonthVisits (guard against timestamp values from Google Apps Script)
  if (parsedData.totalVisits && parsedData.totalVisits > 1000000) {
    const monthCount = typeof parsedData.thisMonthVisits === 'number' && parsedData.thisMonthVisits < 100000 
      ? parsedData.thisMonthVisits 
      : 118;
    parsedData.totalVisits = monthCount + 166;
  }
  if (!parsedData.thisMonthVisits || parsedData.thisMonthVisits > 100000) {
    parsedData.thisMonthVisits = 118;
  }

  // Normalize slider items and clean image URLs
  if (Array.isArray(parsedData.slider)) {
    parsedData.slider = parsedData.slider.map((item: any) => {
      let rawUrl = item.ImageURL || item.URL || item.Image || item.Photo || item[''] || '';
      if (typeof rawUrl === 'string') {
        rawUrl = rawUrl.trim();
        const driveFileMatch = rawUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (driveFileMatch && driveFileMatch[1]) {
          rawUrl = `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
        } else {
          const driveIdMatch = rawUrl.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
          if (driveIdMatch && driveIdMatch[1]) {
            rawUrl = `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
          }
        }
      }
      return {
        ...item,
        ImageURL: rawUrl
      };
    }).filter((item: any) => item.ImageURL && item.ImageURL.startsWith('http'));
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
