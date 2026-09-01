export interface AppSettings {
  rowNum?: number;
  SiteName: string;
  SubSiteName: string;
  LogoURL: string;
  AdminPass?: number | string;
  HeroTitle: string;
  HeroSubTitle: string;
  SlideInterval?: number;
  FieldsDescription?: string;
}

export interface SliderItem {
  rowNum?: number;
  ImageURL: string;
}

export interface ExternalLink {
  rowNum?: number;
  Name: string;
  URL: string;
}

export interface ContactInfo {
  rowNum?: number;
  Address?: string;
  AddressLink?: string;
  Phone?: string;
  InternalPhone?: string;
  PhoneInternal?: string;
  Extension?: string;
  Ext?: string;
  Email?: string;
  LineURL?: string;
  LineText?: string;
  FacebookURL?: string;
  FacebookText?: string;
  Copyright?: string;
  [key: string]: any;
}

export interface KnowledgeItem {
  rowNum?: number;
  Title: string;
  Category: string;
  Details: string;
  FileURL?: string;
  Date?: string;
  [key: string]: any;
}

export function getGoogleDriveImageCandidates(rawUrl: string): string[] {
  if (!rawUrl || typeof rawUrl !== 'string') return [];
  const trimmed = rawUrl.trim();
  if (!trimmed) return [];

  const match1 = trimmed.match(/(?:drive|docs)\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const match2 = trimmed.match(/(?:drive|docs)\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
  const match3 = trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  const fileId = (match1 && match1[1]) || (match2 && match2[1]) || (match3 && match3[1]);

  if (fileId) {
    return [
      `https://lh3.googleusercontent.com/d/${fileId}`,
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
      `https://drive.google.com/uc?export=view&id=${fileId}`
    ];
  }

  return [trimmed];
}

export function formatGoogleDriveImageUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const candidates = getGoogleDriveImageCandidates(rawUrl);
  return candidates[0] || rawUrl;
}

export function extractFileLink(item: any): string | null {
  if (!item || typeof item !== 'object') return null;

  const priorityKeys = [
    'FileURL', 'FileLink', 'Link', 'PDFLink', 'URL', 'Url', 
    'DownloadURL', 'DocURL', 'DriveLink', 'AttachmentLink', 
    'Attachment', 'File', 'LinkFile', 'GoogleDrive', 'DocLink', 'file_url', 'file_link'
  ];

  for (const key of priorityKeys) {
    if (item[key] && typeof item[key] === 'string' && item[key].trim().startsWith('http')) {
      return item[key].trim();
    }
  }

  for (const [key, val] of Object.entries(item)) {
    if (typeof val === 'string' && (val.trim().startsWith('http://') || val.trim().startsWith('https://'))) {
      const lowerKey = key.toLowerCase();
      if (!lowerKey.includes('image') && !lowerKey.includes('photo') && !lowerKey.includes('avatar') && !lowerKey.includes('logo')) {
        return val.trim();
      }
    }
  }

  return null;
}

export function formatThaiFullDate(dateStr?: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // Try YYYY-MM-DD or YYYY/MM/DD
  const matchYMD = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (matchYMD) {
    const year = parseInt(matchYMD[1], 10);
    const month = parseInt(matchYMD[2], 10) - 1;
    const day = parseInt(matchYMD[3], 10);
    if (month >= 0 && month <= 11) {
      const thaiYear = year > 2400 ? year : year + 543;
      return `${day} ${thaiMonths[month]} ${thaiYear}`;
    }
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const matchDMY = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (matchDMY) {
    const day = parseInt(matchDMY[1], 10);
    const month = parseInt(matchDMY[2], 10) - 1;
    const year = parseInt(matchDMY[3], 10);
    if (month >= 0 && month <= 11) {
      const thaiYear = year > 2400 ? year : year + 543;
      return `${day} ${thaiMonths[month]} ${thaiYear}`;
    }
  }

  // Try standard Date parsing
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const month = d.getMonth();
      const year = d.getFullYear();
      const thaiYear = year > 2400 ? year : year + 543;
      return `${day} ${thaiMonths[month]} ${thaiYear}`;
    }
  } catch {
    // fallback to original string
  }

  return trimmed;
}

export function isNewItem(dateStr?: string, daysThreshold = 7): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  if (!trimmed) return false;

  let targetDate: Date | null = null;

  // Match YYYY-MM-DD or YYYY/MM/DD
  const matchYMD = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (matchYMD) {
    let year = parseInt(matchYMD[1], 10);
    if (year > 2400) year -= 543; // Convert Thai Buddhist year to CE for Date calculation
    const month = parseInt(matchYMD[2], 10) - 1;
    const day = parseInt(matchYMD[3], 10);
    targetDate = new Date(year, month, day);
  } else {
    const matchDMY = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (matchDMY) {
      let year = parseInt(matchDMY[3], 10);
      if (year > 2400) year -= 543;
      const month = parseInt(matchDMY[2], 10) - 1;
      const day = parseInt(matchDMY[1], 10);
      targetDate = new Date(year, month, day);
    } else {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        targetDate = d;
      }
    }
  }

  if (!targetDate || isNaN(targetDate.getTime())) return false;

  const now = new Date();
  // Time difference in milliseconds
  const diffMs = now.getTime() - targetDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // If added in the future or within the past `daysThreshold` days, treat as NEW
  return diffDays >= -1 && diffDays <= daysThreshold;
}

export function parseDateForSort(dateStr?: string): number {
  if (!dateStr || typeof dateStr !== 'string') return 0;
  const trimmed = dateStr.trim();
  if (!trimmed) return 0;

  // Match YYYY-MM-DD or YYYY/MM/DD
  const matchYMD = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (matchYMD) {
    let year = parseInt(matchYMD[1], 10);
    if (year > 2400) year -= 543;
    const month = parseInt(matchYMD[2], 10) - 1;
    const day = parseInt(matchYMD[3], 10);
    return new Date(year, month, day).getTime() || 0;
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  const matchDMY = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (matchDMY) {
    let year = parseInt(matchDMY[3], 10);
    if (year > 2400) year -= 543;
    const month = parseInt(matchDMY[2], 10) - 1;
    const day = parseInt(matchDMY[1], 10);
    return new Date(year, month, day).getTime() || 0;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

export interface FormItem {
  rowNum?: number;
  Level1: string;
  Level2?: string;
  Level3?: string;
  Title: string;
  FileURL?: string;
  FileType?: string;
  Notes?: string;
  [key: string]: any;
}

export interface FormCategoryMeta {
  rowNum?: number;
  Name: string;
  Icon?: string;
  Description?: string;
  BadgeText?: string;
  SummaryLink?: string;
  ExternalLink?: string;
  Link?: string;
  URL?: string;
  GuideLink?: string;
  ButtonText?: string;
  ImageURL?: string;
  [key: string]: any;
}

export interface AcademicBranch {
  rowNum?: number;
  Group: string;
  Field: string;
  Subfield: string;
  Branch?: string;
}

export interface BranchConfig {
  rowNum?: number;
  Title: string;
  Content: string;
}

export interface AppsScriptData {
  settings: AppSettings;
  slider: SliderItem[];
  contact: ContactInfo;
  links?: ExternalLink[];
  categories: any[];
  mainMenus?: any[];
  items: KnowledgeItem[];
  formsData: FormItem[];
  formCatsMeta: FormCategoryMeta[];
  branches: AcademicBranch[];
  branchConfigs: BranchConfig[];
  totalVisits: number;
  thisMonthVisits: number;
  lastUpdated?: string;
  [key: string]: any;
}
