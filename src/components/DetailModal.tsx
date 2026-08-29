import React from 'react';
import { KnowledgeItem } from '../types';
import { 
  X, 
  Tag, 
  Calendar, 
  FileText,
  FileCheck,
  Paperclip,
  ArrowUpRight
} from 'lucide-react';

interface DetailModalProps {
  item: KnowledgeItem | null;
  onClose: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (item: KnowledgeItem) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  item,
  onClose
}) => {
  if (!item) return null;

  // Extract link from potential Google Sheet keys
  const docLink = item.FileURL || item.FileLink || item.Link || item.PDFLink || item.URL || item.DocumentURL || item.AttachmentLink || item.Attachment;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = d.getDate();
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const month = months[d.getMonth()];
        const year = d.getFullYear() + 543;
        return `${day} ${month} ${year}`;
      }
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const mIdx = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
        return `${parseInt(d, 10)} ${months[mIdx]} ${Number(y) + 543}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-3xl sm:max-w-4xl md:max-w-5xl rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 font-sarabun text-slate-800 p-2 sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* White Header */}
        <div className="bg-white text-slate-900 p-4 sm:p-5 flex items-start justify-between border-b border-slate-200/80 relative">
          <div className="space-y-2 pr-6">
            <span className="inline-flex items-center text-xs font-sarabun font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1 rounded-full">
              <Tag className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span>{item.Category || 'หลักเกณฑ์'}</span>
            </span>
            <h3 className="text-base sm:text-xl font-bold font-prompt leading-snug text-slate-900">
              {item.Title}
            </h3>
            
            {item.Date && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 pt-0.5 font-sarabun">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{formatDate(item.Date)}</span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 leading-relaxed font-sarabun">
          
          {/* Details Content Box */}
          <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold font-sarabun uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>รายละเอียด & คำอธิบาย</span>
            </h4>
            <p className="whitespace-pre-line text-slate-800 leading-relaxed text-xs sm:text-sm font-sarabun">
              {item.Details || 'ไม่มีรายละเอียดเพิ่มเติม'}
            </p>
          </div>

          {/* Attached Document / Google Sheet Link Button Box */}
          {docLink ? (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200/90 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-hidden">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-2xs flex-shrink-0">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold font-sarabun text-emerald-950 flex items-center gap-1.5 flex-wrap">
                    <span>มีเอกสารแนบประกอบ / หนังสือเวียน</span>
                    <span className="bg-emerald-200/80 text-emerald-800 text-[10px] px-2 py-0.2 rounded-full font-semibold">
                      ลิงก์ภายนอก
                    </span>
                  </div>
                </div>
              </div>

              <a
                href={docLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-sarabun font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs flex-shrink-0 cursor-pointer"
              >
                <span>ดูเอกสารแนบเพิ่มเติม</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-500 flex items-center gap-2 font-sarabun">
              <FileCheck className="w-4 h-4 text-slate-400" />
              <span>ไม่มีเอกสารแนบเพิ่มเติมสำหรับรายการนี้</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-3.5 sm:px-5 border-t border-slate-200/80 flex items-center justify-end font-sarabun">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-sarabun font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};

