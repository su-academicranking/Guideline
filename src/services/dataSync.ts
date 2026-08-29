import { AppsScriptData, formatGoogleDriveImageUrl } from '../types';
import { INITIAL_APP_DATA } from '../data/initialData';

export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxLHp1LBXBj4QYgIUq76-fie06_DscaOCbGcirvk1b44fOVyoFmVBungMUTx7ZRua8obg/exec";
const CACHE_KEY = "su_hr_cached_data";
const CACHE_TIMESTAMP_KEY = "su_hr_cache_timestamp";

/**
 * Parses the raw HTML response from Google Apps Script Web App
 * extracting the application state embedded in goog.script.init
 */
export function parseAppsScriptResponse(text: string): AppsScriptData {
  const trimmed = text.trim();
  
  // 1. If the response is already pure JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.data) return parsed.data;
      if (parsed.settings || parsed.items || parsed.categories) return parsed;
    } catch {}
  }

  // 2. Extract from goog.script.init
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
          return JSON.parse(match[1]);
        }
      }
    }
  }

  // 3. Fallback: Search directly for initial-data script tag in HTML
  const directMatch = text.match(/<script id="initial-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (directMatch && directMatch[1]) {
    return JSON.parse(directMatch[1]);
  }

  throw new Error("Unable to parse Google Apps Script HTML response");
}

/**
 * Normalizes and sanitizes the dataset:
 * - Fixes Google Drive URLs
 * - Sanitizes visitor count to prevent timestamp corruption
 */
export function sanitizeAppData(rawData: any): AppsScriptData {
  if (!rawData || typeof rawData !== 'object') {
    return INITIAL_APP_DATA;
  }

  const data: AppsScriptData = {
    ...INITIAL_APP_DATA,
    ...rawData,
    settings: {
      ...INITIAL_APP_DATA.settings,
      ...(rawData.settings || {})
    },
    contact: {
      ...INITIAL_APP_DATA.contact,
      ...(rawData.contact || {})
    }
  };

  // 1. Sanitize Visitor counts
  const rawTotal = typeof rawData.totalVisits === 'number' ? rawData.totalVisits : 284;
  const rawMonth = typeof rawData.thisMonthVisits === 'number' ? rawData.thisMonthVisits : 118;
  
  const monthCount = (rawMonth > 0 && rawMonth < 100000) ? rawMonth : 118;
  const totalCount = (rawTotal > 0 && rawTotal < 1000000) ? rawTotal : monthCount + 166;
  
  data.totalVisits = totalCount;
  data.thisMonthVisits = monthCount;
  data.lastUpdated = new Date().toISOString();

  // 2. Normalize Slider Images
  if (Array.isArray(data.slider)) {
    data.slider = data.slider.map((item: any) => {
      const rawUrl = item.ImageURL || item.URL || item.Image || item.Photo || item[''] || '';
      return {
        ...item,
        ImageURL: formatGoogleDriveImageUrl(rawUrl) || rawUrl
      };
    }).filter((item: any) => item.ImageURL && typeof item.ImageURL === 'string' && item.ImageURL.startsWith('http'));
  }

  // 3. Normalize Form Category Meta image URLs & Links
  if (Array.isArray(data.formCatsMeta)) {
    data.formCatsMeta = data.formCatsMeta.map((cat: any) => ({
      ...cat,
      ImageURL: cat.ImageURL ? formatGoogleDriveImageUrl(cat.ImageURL) : cat.ImageURL
    }));
  }

  return data;
}

/**
 * Gets cached data from localStorage if available, otherwise falls back to INITIAL_APP_DATA
 */
export function getStoredAppData(): AppsScriptData {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && (parsed.items || parsed.categories || parsed.formsData)) {
        return sanitizeAppData(parsed);
      }
    }
  } catch (e) {
    console.warn("Failed to load cached AppData from localStorage", e);
  }
  return INITIAL_APP_DATA;
}

/**
 * Saves fresh data into localStorage
 */
export function storeAppData(data: AppsScriptData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.warn("Failed to save AppData to localStorage", e);
  }
}

/**
 * Fetches fresh live data with multiple fallback methods:
 * 1. Express backend (/api/data) if running on server / Cloud Run
 * 2. Direct Google Apps Script Web App fetch
 * 3. Public CORS Proxies for static GitHub Pages deployment
 */
export async function fetchLiveAppData(forceRefresh = false): Promise<AppsScriptData> {
  const timestamp = Date.now();

  // Strategy 1: Local / Cloud Run Express Backend (/api/data)
  try {
    const endpoint = forceRefresh ? `/api/data?refresh=1&t=${timestamp}` : `/api/data?t=${timestamp}`;
    const res = await fetch(endpoint, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json.success && json.data) {
        const sanitized = sanitizeAppData(json.data);
        storeAppData(sanitized);
        return sanitized;
      }
    }
  } catch {
    // Expected on static hosting like GitHub Pages
  }

  // Strategy 2: Direct Fetch from Google Apps Script Web App
  try {
    const directRes = await fetch(`${APPS_SCRIPT_URL}?t=${timestamp}`, {
      cache: 'no-store'
    });
    if (directRes.ok) {
      const text = await directRes.text();
      const parsed = parseAppsScriptResponse(text);
      const sanitized = sanitizeAppData(parsed);
      storeAppData(sanitized);
      return sanitized;
    }
  } catch {
    // Will try CORS proxies next
  }

  // Strategy 3: CORS Proxy Fallbacks (Specifically for GitHub Pages static environment)
  const proxyEndpoints = [
    `https://corsproxy.io/?${encodeURIComponent(APPS_SCRIPT_URL + '?t=' + timestamp)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(APPS_SCRIPT_URL + '?t=' + timestamp)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(APPS_SCRIPT_URL + '?t=' + timestamp)}`
  ];

  for (const proxyUrl of proxyEndpoints) {
    try {
      const proxyRes = await fetch(proxyUrl, { cache: 'no-store' });
      if (proxyRes.ok) {
        const text = await proxyRes.text();
        const parsed = parseAppsScriptResponse(text);
        if (parsed && (parsed.categories || parsed.items || parsed.settings)) {
          const sanitized = sanitizeAppData(parsed);
          storeAppData(sanitized);
          return sanitized;
        }
      }
    } catch {
      continue;
    }
  }

  // Strategy 4: If all network calls fail, return localStorage cache or bundled initial data
  const cached = getStoredAppData();
  return cached;
}
