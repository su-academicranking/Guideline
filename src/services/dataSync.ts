import { AppsScriptData, formatGoogleDriveImageUrl } from '../types';
import { INITIAL_APP_DATA } from '../data/initialData';

export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxLHp1LBXBj4QYgIUq76-fie06_DscaOCbGcirvk1b44fOVyoFmVBungMUTx7ZRua8obg/exec";
export const GOOGLE_SHEET_ID = "1bRt2w7QT3fcP5m02WZqqiIAGQmOgml_IQyUrxQAFAPE";

const CACHE_KEY = "su_hr_cached_data";
const CACHE_TIMESTAMP_KEY = "su_hr_cache_timestamp";

/**
 * Directly fetches and parses a specific tab from Google Sheets via Google Visualization API (GViz).
 * This works directly inside browser environments (GitHub Pages) without CORS restrictions!
 */
async function fetchSheetTabGViz(sheetId: string, tabName: string, signal?: AbortSignal): Promise<any[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}&t=${Date.now()}`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`GViz HTTP error ${res.status}`);
  const text = await res.text();
  
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
  if (!match) throw new Error(`Invalid GViz response format for tab ${tabName}`);
  
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

export function parseVisitsFromStatsTab(statsRows: any[]): { totalVisits: number; thisMonthVisits: number } {
  if (!Array.isArray(statsRows) || statsRows.length === 0) {
    return { totalVisits: 0, thisMonthVisits: 0 };
  }

  let monthlySum = 0;
  let currentMonthCount = 0;
  let explicitTotal = 0;
  let explicitThisMonth = 0;
  let latestMonthCount = 0;

  const now = new Date();
  const currentMM = String(now.getMonth() + 1).padStart(2, '0');
  const currentYYYY = String(now.getFullYear());
  const currentBE = String(now.getFullYear() + 543);

  const currentMonthKeys = [
    `${currentMM}-${currentYYYY}`, // 08-2026
    `${currentYYYY}-${currentMM}`, // 2026-08
    `${currentMM}/${currentYYYY}`, // 08/2026
    `${currentYYYY}/${currentMM}`, // 2026/08
    `${currentMM}-${currentBE}`,   // 08-2569
    `${currentBE}-${currentMM}`,   // 2569-08
    `${currentMM}/${currentBE}`,   // 08/2569
    `${currentBE}/${currentMM}`,   // 2569/08
  ];

  statsRows.forEach((row) => {
    // Column 1 is Month/Year or Special Metric Name
    const key = String(row.Month_Year || row.Month || row.A || row.Date || Object.values(row)[1] || Object.values(row)[0] || '').trim();
    // Column 2 is Count / Visits
    const valRaw = row.Count !== undefined ? row.Count : (row.Visits !== undefined ? row.Visits : (row.B !== undefined ? row.B : Object.values(row)[2]));
    const val = typeof valRaw === 'number' ? valRaw : parseInt(String(valRaw).replace(/,/g, ''), 10);

    const lowerKey = key.toLowerCase();

    if (lowerKey === 'totalvisits' || lowerKey === 'total' || key === 'จำนวนผู้เข้าชมทั้งหมด') {
      if (!isNaN(val) && val > 0) explicitTotal = val;
    } else if (lowerKey === 'thismonthvisits' || lowerKey === 'thismonth' || lowerKey === 'month' || key === 'จำนวนผู้เข้าชมในเดือนนี้') {
      if (!isNaN(val) && val > 0) explicitThisMonth = val;
    } else if (key && !['lastmonth', 'lastupdated', 'timestamp', 'datetime'].includes(lowerKey)) {
      if (!isNaN(val) && val >= 0) {
        monthlySum += val;
        latestMonthCount = val;

        const isCurrentMonth = currentMonthKeys.some((k) => key.includes(k)) || 
          (key.includes(currentMM) && (key.includes(currentYYYY) || key.includes(currentBE)));
        if (isCurrentMonth) {
          currentMonthCount = val;
        }
      }
    }
  });

  const totalVisits = monthlySum > 0 ? (explicitTotal > monthlySum ? explicitTotal : monthlySum) : (explicitTotal || 0);
  const thisMonthVisits = currentMonthCount > 0 ? currentMonthCount : (explicitThisMonth > 0 ? explicitThisMonth : latestMonthCount);

  return { totalVisits, thisMonthVisits };
}

/**
 * Fetches all tabs directly from Google Sheet and constructs AppsScriptData object.
 * Perfect for GitHub Pages and static deployments.
 */
export async function fetchDirectFromGoogleSheet(sheetId = GOOGLE_SHEET_ID): Promise<AppsScriptData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const [
      settingsRows,
      categoriesRows,
      dataRows,
      itemsRows,
      sliderRows,
      formCatsRows,
      formsRows,
      contactRows,
      branchesRows,
      statsRows
    ] = await Promise.all([
      fetchSheetTabGViz(sheetId, "Settings", controller.signal).catch(() => []),
      fetchSheetTabGViz(sheetId, "Categories", controller.signal).catch(() => []),
      fetchSheetTabGViz(sheetId, "Data", controller.signal).catch(() => []),
      fetchSheetTabGViz(sheetId, "Items", controller.signal).catch(() => []),
      fetchSheetTabGViz(sheetId, "Slider", controller.signal).catch(() => []),
      fetchSheetTabGViz(sheetId, "FormCategories", controller.signal).catch(() => []),
      fetchSheetTabGViz(sheetId, "Forms", controller.signal).catch(() => []),
      fetchSheetTabGViz(sheetId, "Contact", controller.signal).catch(() => []),
      fetchSheetTabGViz(sheetId, "Branches", controller.signal).catch(() => []),
      fetchSheetTabGViz(sheetId, "Stats", controller.signal).catch(() => [])
    ]);

    clearTimeout(timeoutId);

    const settings = settingsRows.length > 0 ? settingsRows[0] : INITIAL_APP_DATA.settings;
    
    // 1. Extract and normalize Knowledge Items (Q&A and Circulars)
    const rawKnowledgeRows = dataRows.length > 0 ? dataRows : itemsRows;
    const items = rawKnowledgeRows.map((r: any, idx: number) => ({
      rowNum: r.rowNum || idx + 2,
      Category: r.Category || r.Group || "Q&A",
      Title: r.Title || r.Question || r.Topic || r.Name || "",
      Details: r.Details || r.Answer || r.Description || r.Detail || "",
      Date: r.Date || "",
      FileURL: r.Link || r.FileURL || r.URL || r.LinkURL || r.File || "",
      Link: r.Link || r.FileURL || r.URL || "",
      ImageURL: r.ImageURL ? formatGoogleDriveImageUrl(r.ImageURL) : ""
    })).filter((item: any) => item.Title && item.Title.trim().length > 0 && item.Title !== "Title");

    // 2. Extract and normalize Categories
    let categories = categoriesRows
      .map((c: any) => c.Name || c.A || Object.values(c)[1])
      .filter((c: any) => typeof c === 'string' && c.trim().length > 0 && c !== "Name");
    
    // If categories is empty or incomplete, infer from items
    const inferredCategories = Array.from(new Set(items.map((i: any) => i.Category).filter(Boolean)));
    inferredCategories.forEach((cat: any) => {
      if (!categories.includes(cat)) categories.push(cat);
    });
    if (categories.length === 0) {
      categories = INITIAL_APP_DATA.categories;
    }

    // 3. Map forms to FormItem[]
    const formsData: any[] = formsRows.map((row: any) => ({
      ...row,
      Level1: row.Level1 || row.Category || "การประเมินการสอน",
      Level2: row.Level2 || "",
      Level3: row.Level3 || "",
      Title: row.Title || row.Name || "",
      FileURL: row.LinkURL || row.FileURL || row.URL || row.Link || ""
    })).filter((f: any) => f.Title && f.Title !== "Title");

    // 4. Map Academic Branches
    const branches = branchesRows.map((r: any, idx: number) => ({
      rowNum: r.rowNum || idx + 2,
      Group: r.Group || r.A || "",
      Field: r.Field || r.B || "",
      Subfield: r.Subfield || r.C || "",
      Branch: r.Branch || r.D || ""
    })).filter((b: any) => b.Group && b.Group !== "Group" && b.Group.trim() !== "");

    const contact = contactRows.length > 0 ? contactRows[0] : INITIAL_APP_DATA.contact;

    // 5. Parse Visitor Statistics from Stats tab
    const parsedVisits = parseVisitsFromStatsTab(statsRows);

    const result: AppsScriptData = {
      settings,
      categories,
      items: items.length > 0 ? items : INITIAL_APP_DATA.items,
      slider: sliderRows,
      formCatsMeta: formCatsRows,
      formsData: formsData.length > 0 ? formsData : INITIAL_APP_DATA.formsData,
      contact,
      branches: branches.length > 0 ? branches : INITIAL_APP_DATA.branches,
      branchConfigs: INITIAL_APP_DATA.branchConfigs,
      totalVisits: parsedVisits.totalVisits > 0 ? parsedVisits.totalVisits : INITIAL_APP_DATA.totalVisits,
      thisMonthVisits: parsedVisits.thisMonthVisits > 0 ? parsedVisits.thisMonthVisits : INITIAL_APP_DATA.thisMonthVisits,
      lastUpdated: new Date().toISOString()
    };

    return sanitizeAppData(result);
  } finally {
    clearTimeout(timeoutId);
  }
}

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
 * - Sanitizes visitor count
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
  const rawTotal = typeof rawData.totalVisits === 'number' ? rawData.totalVisits : 0;
  const rawMonth = typeof rawData.thisMonthVisits === 'number' ? rawData.thisMonthVisits : 0;
  
  data.totalVisits = rawTotal > 0 ? rawTotal : (INITIAL_APP_DATA.totalVisits || 0);
  data.thisMonthVisits = rawMonth > 0 ? rawMonth : (INITIAL_APP_DATA.thisMonthVisits || 0);
  data.lastUpdated = new Date().toISOString();

  // 2. Normalize Slider Images
  if (Array.isArray(data.slider)) {
    data.slider = data.slider.map((item: any) => {
      if (typeof item === 'string') {
        return { ImageURL: formatGoogleDriveImageUrl(item) };
      }
      const rawUrl = item.ImageURL || item.URL || item.Image || item.Photo || item.Link || item.Url || item.image || item.url || item[''] || '';
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
      if (parsed && (parsed.items || parsed.categories || parsed.formsData || parsed.slider)) {
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
 * Fetches fresh live data with comprehensive multi-layer strategy:
 * 1. Express backend (/api/data) if running on full-stack container / Cloud Run
 * 2. Direct Google Sheets GViz API (Fastest & 100% CORS-free on GitHub Pages)
 * 3. Direct Google Apps Script Web App fetch
 * 4. Public CORS Proxy Fallbacks
 * 5. Cached localStorage / Bundled data
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

  // Strategy 2: Direct Google Sheets GViz Fetch (Primary & most reliable for GitHub Pages!)
  try {
    const sheetData = await fetchDirectFromGoogleSheet(GOOGLE_SHEET_ID);
    if (sheetData && (sheetData.slider?.length || sheetData.formCatsMeta?.length || Object.keys(sheetData.formsData || {}).length)) {
      storeAppData(sheetData);
      return sheetData;
    }
  } catch (err) {
    console.warn("Direct Google Sheet GViz fetch attempt failed, trying fallbacks...", err);
  }

  // Strategy 3: Direct Fetch from Google Apps Script Web App
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

  // Strategy 4: CORS Proxy Fallbacks
  const proxyEndpoints = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(APPS_SCRIPT_URL + '?t=' + timestamp)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(APPS_SCRIPT_URL + '?t=' + timestamp)}`,
    `https://corsproxy.io/?${encodeURIComponent(APPS_SCRIPT_URL + '?t=' + timestamp)}`
  ];

  for (const proxyUrl of proxyEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      
      const proxyRes = await fetch(proxyUrl, { 
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (proxyRes.ok) {
        const text = await proxyRes.text();
        const parsed = parseAppsScriptResponse(text);
        if (parsed && (parsed.categories || parsed.items || parsed.settings || parsed.slider)) {
          const sanitized = sanitizeAppData(parsed);
          storeAppData(sanitized);
          return sanitized;
        }
      }
    } catch {
      continue;
    }
  }

  // Strategy 5: If all network calls fail, return localStorage cache or bundled initial data
  const cached = getStoredAppData();
  return cached;
}

