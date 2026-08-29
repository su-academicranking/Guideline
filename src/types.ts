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
  Email?: string;
  LineURL?: string;
  LineText?: string;
  FacebookURL?: string;
  FacebookText?: string;
  Copyright?: string;
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
