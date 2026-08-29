import React from 'react';
import { KnowledgeItem, FormItem } from '../types';
import { Bookmark, X, Trash2, ExternalLink, Download, FileText, HelpCircle } from 'lucide-react';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: any[];
  onRemoveBookmark: (item: any) => void;
  onClearAll: () => void;
  onSelectItem: (item: KnowledgeItem) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  bookmarks = [],
  onRemoveBookmark,
  onClearAll,
  onSelectItem
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h3 className="text-base font-bold font-prompt text-white">รายการที่บันทึกไว้ ({bookmarks.length})</h3>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
          {bookmarks.length > 0 ? (
            bookmarks.map((bm, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex items-start justify-between gap-3 group">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      {bm.Category || bm.Level1 || 'รายการบันทึก'}
                    </span>
                  </div>

                  <h4 
                    onClick={() => {
                      if (bm.Details) {
                        onSelectItem(bm);
                        onClose();
                      }
                    }}
                    className={`text-sm font-bold text-slate-900 ${bm.Details ? 'hover:text-emerald-700 cursor-pointer' : ''}`}
                  >
                    {bm.Title}
                  </h4>

                  {bm.Details && (
                    <p className="text-xs text-slate-500 line-clamp-2">{bm.Details}</p>
                  )}
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0 pt-1">
                  {bm.FileURL && (
                    <a
                      href={bm.FileURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg"
                      title="ดาวน์โหลดไฟล์"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => onRemoveBookmark(bm)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    title="ลบรายการนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-medium text-slate-600">ยังไม่มีรายการที่บันทึกไว้</p>
              <p className="text-[11px] text-slate-400">คุณสามารถกดไอคอนบุ๊กมาร์กที่การ์ดข้อคำถามหรือแบบฟอร์มเพื่อบันทึกไว้ดูภายหลังได้</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          {bookmarks.length > 0 ? (
            <button
              onClick={onClearAll}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างทั้งหมด</span>
            </button>
          ) : <div></div>}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium cursor-pointer"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};
