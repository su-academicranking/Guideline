import React, { useState, useMemo } from 'react';
import { FormItem, FormCategoryMeta, extractFileLink } from '../types';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Search, 
  FolderTree,
  ChevronRight, 
  ChevronDown,
  Filter,
  FileCheck, 
  FileCode, 
  Info,
  Bookmark,
  BookmarkCheck,
  X
} from 'lucide-react';

interface FormsHubProps {
  forms: FormItem[];
  formCatsMeta: FormCategoryMeta[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  bookmarks: any[];
  onToggleBookmark: (form: FormItem) => void;
}

export const FormsHub: React.FC<FormsHubProps> = ({
  forms = [],
  formCatsMeta = [],
  searchQuery,
  setSearchQuery,
  bookmarks,
  onToggleBookmark
}) => {
  // Extract unique Level 1 categories
  const level1Categories = useMemo(() => {
    return Array.from(new Set(forms.map(f => f.Level1).filter(Boolean)));
  }, [forms]);

  const [selectedL1, setSelectedL1] = useState<string>('');

  // Set initial Level 1 category
  React.useEffect(() => {
    if (level1Categories.length > 0 && (!selectedL1 || !level1Categories.includes(selectedL1))) {
      setSelectedL1(level1Categories[0]);
    }
  }, [level1Categories]);

  // Active Category metadata
  const activeMeta = formCatsMeta.find(m => m.Name === selectedL1);

  // Nested form tree for selected Level 1
  const nestedForms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    
    // Filter forms matching search query across all categories or selected category
    const filtered = forms.filter(item => {
      const matchL1 = !selectedL1 || item.Level1 === selectedL1;
      const matchSearch = !q || 
        (item.Title && item.Title.toLowerCase().includes(q)) ||
        (item.Level2 && item.Level2.toLowerCase().includes(q)) ||
        (item.Level3 && item.Level3.toLowerCase().includes(q)) ||
        (item.Notes && item.Notes.toLowerCase().includes(q));

      return matchL1 && matchSearch;
    });

    // Group by Level2 -> Level3
    const tree: Record<string, Record<string, FormItem[]>> = {};
    filtered.forEach(item => {
      const l2 = item.Level2 || '_none_';
      const l3 = item.Level3 || '_none_';
      if (!tree[l2]) tree[l2] = {};
      if (!tree[l2][l3]) tree[l2][l3] = [];
      tree[l2][l3].push(item);
    });

    return tree;
  }, [forms, selectedL1, searchQuery]);

  const getFileTypeStyle = (url?: string, typeStr?: string) => {
    const combined = ((url || '') + ' ' + (typeStr || '')).toLowerCase();
    if (combined.includes('pdf')) {
      return { label: 'PDF', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
    if (combined.includes('doc') || combined.includes('word')) {
      return { label: 'DOCX', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    if (combined.includes('xls') || combined.includes('excel')) {
      return { label: 'XLSX', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    return { label: 'ลิงก์/ดาวน์โหลด', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
  };

  const isBookmarked = (form: FormItem) => {
    return bookmarks.some(b => b.Title === form.Title && b.Level1 === form.Level1);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Level 1 Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-sarabun text-emerald-900">
              <span>หลักเกณฑ์ & แบบฟอร์ม</span>
            </h3>
          </div>

          <div className="flex items-center space-x-2 text-xs font-sarabun text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <span>หมวดหมู่ทั้งหมด <strong className="text-emerald-700 font-bold font-sarabun">{level1Categories.length}</strong> หมวด</span>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์คำเพื่อค้นหาแบบฟอร์ม, คู่มือ หรือชื่อเอกสาร..."
              className="w-full pl-8 sm:pl-9 pr-8 sm:pr-9 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-sarabun text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/60 transition-colors"
                title="ล้างคำค้นหา"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Level 1 Category Dropdown */}
        <div className="pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <label htmlFor="forms-category-select" className="text-xs font-bold font-sarabun text-emerald-900">
                เลือกหมวดหมู่แบบฟอร์ม:
              </label>
            </div>

            <div className="relative w-full sm:w-80">
              <select
                id="forms-category-select"
                value={selectedL1}
                onChange={(e) => setSelectedL1(e.target.value)}
                className="w-full pl-3.5 pr-10 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs sm:text-sm font-sarabun font-semibold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs appearance-none cursor-pointer truncate"
              >
                {level1Categories.map((cat, idx) => (
                  <option key={idx} value={cat} className="font-sarabun text-slate-800">
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-emerald-600">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Category Description Meta & Guideline Summary Link Button (แสดงเฉพาะเมื่อหมวดหมู่นี้มีลิงก์ภายนอก/สรุปหลักเกณฑ์เท่านั้น) */}
        {(() => {
          const categoryLink = activeMeta?.SummaryLink || 
                               activeMeta?.ExternalLink || 
                               activeMeta?.Link || 
                               activeMeta?.URL || 
                               activeMeta?.GuideLink || 
                               extractFileLink(activeMeta) || 
                               '';

          if (!categoryLink) return null;

          const buttonLabel = activeMeta?.ButtonText || 
                              (activeMeta?.BadgeText ? `สรุปหลักเกณฑ์ (${activeMeta.BadgeText})` : 'สรุปหลักเกณฑ์');

          return (
            <div className="mt-4 p-3.5 sm:p-4 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/90 border border-emerald-200/90 rounded-2xl shadow-2xs font-sarabun flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-200">
                  <Info className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-emerald-950 font-sarabun truncate">
                      {selectedL1 || 'หมวดหมู่แบบฟอร์ม'}
                    </span>
                    {activeMeta?.BadgeText && (
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200/80">
                        {activeMeta.BadgeText}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-sarabun leading-relaxed">
                    {activeMeta?.Description || 'สามารถศึกษาหลักเกณฑ์ แนวปฏิบัติ และดาวน์โหลดเอกสารแบบฟอร์มที่เกี่ยวข้อง'}
                  </p>
                </div>
              </div>

              {/* Summary Guideline Button */}
              <a
                href={categoryLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs sm:text-sm font-bold font-sarabun rounded-xl shadow-xs hover:shadow-md transition-all flex-shrink-0 cursor-pointer group"
                title={`เปิดดู ${buttonLabel}`}
              >
                <FileText className="w-4 h-4 text-white group-hover:scale-110 transition-transform flex-shrink-0" />
                <span>{buttonLabel}</span>
                <ExternalLink className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0" />
              </a>
            </div>
          );
        })()}
      </div>

      {/* Forms Nested Accordion/List */}
      {Object.keys(nestedForms).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(nestedForms).map(([l2Key, l3Map], l2Idx) => {
            const isL2None = l2Key === '_none_';

            return (
              <div key={l2Idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                
                {/* Level 2 Header */}
                {!isL2None && (
                  <div className="bg-slate-900 text-white px-4 py-2.5 font-bold font-sarabun text-xs sm:text-sm flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{l2Key}</span>
                    </div>
                  </div>
                )}

                {/* Level 3 Groups & Items */}
                <div className="p-3 sm:p-5 space-y-4">
                  {Object.entries(l3Map).map(([l3Key, formItems], l3Idx) => {
                    const isL3None = l3Key === '_none_';

                    return (
                      <div key={l3Idx} className="space-y-2.5">
                        {!isL3None && (
                          <h4 className="text-xs sm:text-sm font-bold font-sarabun text-slate-800 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{l3Key}</span>
                          </h4>
                        )}

                        <div className="flex flex-col gap-2.5">
                          {formItems.map((form, itemIdx) => {
                            const formDocLink = extractFileLink(form);
                            const typeBadge = getFileTypeStyle(formDocLink || form.FileURL, form.FileType);

                            return (
                              <div
                                key={itemIdx}
                                className="bg-white hover:bg-emerald-50/20 border border-slate-200/90 hover:border-emerald-400 rounded-xl p-3 sm:p-3.5 transition-all shadow-2xs group"
                              >
                                <div className="space-y-1 font-sarabun">
                                  <h5 className="text-xs sm:text-sm font-semibold font-sarabun text-emerald-800 hover:text-emerald-900 transition-colors leading-snug break-words">
                                    {formDocLink ? (
                                      <a
                                        href={formDocLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline text-[#2b3c56] hover:text-[#1a2638] inline-flex items-center gap-1.5"
                                      >
                                        <span>{form.Title}</span>
                                        <ExternalLink className="w-3 h-3 inline text-[#2b3c56] flex-shrink-0" />
                                      </a>
                                    ) : (
                                      <span>{form.Title}</span>
                                    )}
                                  </h5>

                                  {form.Notes && (
                                    <p className="text-[11px] sm:text-xs font-sarabun text-slate-600 bg-slate-50/80 p-2 rounded-lg border border-slate-200/60 shadow-2xs mt-1">
                                      <span className="font-semibold text-slate-700 font-sarabun">หมายเหตุ: </span>
                                      {form.Notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-700">ไม่พบแบบฟอร์มที่ต้องการ</h4>
          <p className="text-xs text-slate-400 mt-1">ลองล้างคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
          >
            ล้างคำค้นหา
          </button>
        </div>
      )}

    </div>
  );
};
