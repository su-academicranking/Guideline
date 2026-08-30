import React from 'react';
import { ContactInfo, ExternalLink } from '../types';
import { 
  Building2, MapPin, Phone, Mail, Globe, Eye, 
  ExternalLink as ExternalLinkIcon
} from 'lucide-react';

interface ContactFooterProps {
  contact?: ContactInfo;
  links?: ExternalLink[];
  siteName: string;
  subSiteName: string;
  totalVisits: number;
  thisMonthVisits: number;
  logoUrl?: string;
}

export const ContactFooter: React.FC<ContactFooterProps> = ({
  contact,
  links = [],
  siteName,
  subSiteName,
  totalVisits = 0,
  thisMonthVisits = 0,
  logoUrl
}) => {
  const currentYearBE = new Date().getFullYear() + 543;

  return (
    <footer className="bg-white text-slate-700 pt-12 pb-8 border-t border-slate-200/80 mt-16 font-sarabun relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 pb-8 border-b border-slate-100">
          
          {/* Column 1: Brand & Contact Us underneath (LG: 7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Brand Header */}
            <div className="flex items-center space-x-3">
              <div className="h-10 sm:h-11 w-auto flex items-center justify-center flex-shrink-0">
                <img 
                  src={logoUrl || "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Silpakorn_University.svg"} 
                  alt="SU Logo"
                  className="h-10 sm:h-11 w-auto max-w-[120px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold font-prompt text-slate-900 leading-tight">
                  {siteName || 'กองทรัพยากรมนุษย์'}
                </h4>
                <p className="text-xs font-sarabun text-slate-500">
                  {subSiteName || 'สำนักงานอธิการบดี มหาวิทยาลัยศิลปากร'}
                </p>
              </div>
            </div>

            {/* Contact Us Section Directly Under Brand */}
            <div className="space-y-3 pt-1">
              <h5 className="text-sm font-bold font-prompt text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>ติดต่อเรา</span>
              </h5>

              <p className="text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-line bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 font-sarabun">
                {contact?.Address || 'งานพัฒนาทรัพยากรมนุษย์ กองทรัพยากรมนุษย์ สำนักงานอธิการบดี (ตลิ่งชัน) มหาวิทยาลัยศิลปากร 215 ถนนบรมราชชนนี แขวง/เขตตลิ่งชัน กรุงเทพมหานคร 10700'}
              </p>

              {contact?.AddressLink && (
                <a
                  href={contact.AddressLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 font-prompt font-medium transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>เปิดแผนที่ Google Maps</span>
                </a>
              )}

              <div className="text-xs text-slate-500 space-y-1.5 pt-1">
                {contact?.Phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>โทรศัพท์: {contact.Phone}</span>
                  </div>
                )}
                {contact?.Email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>อีเมล: {contact.Email}</span>
                  </div>
                )}
              </div>

              {/* Social Contact Buttons (Facebook / Line) */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {contact?.FacebookURL && (
                  <a
                    href={contact.FacebookURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs px-3.5 py-1.5 rounded-full transition-all group shadow-2xs cursor-pointer font-prompt"
                    title="Facebook กองทรัพยากรมนุษย์"
                  >
                    <svg className="w-4 h-4 fill-current text-blue-600 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="font-prompt font-semibold text-[11px]">Facebook Page</span>
                  </a>
                )}

                {contact?.LineURL && (
                  <a
                    href={contact.LineURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs px-3.5 py-1.5 rounded-full transition-all group shadow-2xs cursor-pointer font-prompt"
                    title="Line Official Account"
                  >
                    <svg className="w-4 h-4 fill-current text-emerald-500 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.629.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.412-.105-.531-.284l-1.897-2.709v2.333c0 .347-.281.629-.627.629-.349 0-.63-.282-.63-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.216 0 .412.104.532.285l1.899 2.707V8.108c0-.348.281-.63.63-.63.345 0 .627.285.627.63v4.771zm-5.741 0c0 .347-.282.629-.631.629-.345 0-.627-.282-.627-.629V8.108c0-.282.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.282-.63-.629V8.108c0-.348.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08-.085.608-.39 2.378-.426 2.893-.059.833.389.48.826.242 3.655-1.99 9.877-5.815 11.233-9.957C23.63 13.432 24 11.91 24 10.314"/>
                    </svg>
                    <span className="font-prompt font-semibold text-[11px]">Line Official</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: External Links from Google Sheet (LG: 5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h5 className="text-sm font-bold font-prompt text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>ลิงก์ภายนอกที่เกี่ยวข้อง</span>
            </h5>

            {links && links.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {links.map((link, idx) => (
                  <li key={idx}>
                    <a 
                      href={link.URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between text-slate-700 hover:text-emerald-800 bg-slate-50/80 hover:bg-emerald-50/50 px-3.5 py-2.5 rounded-xl border border-slate-200/60 hover:border-emerald-200 transition-all"
                    >
                      <span className="line-clamp-1 pr-2 font-sarabun font-medium">{link.Name}</span>
                      <ExternalLinkIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-slate-400 font-light">
                ไม่มีข้อมูลลิงก์ภายนอก
              </div>
            )}
          </div>

        </div>

        {/* Visitor Statistics - Single Line Text above Copyright (Original Style) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-slate-500 font-sarabun text-center py-2 bg-slate-50/60 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-prompt font-medium text-slate-700">สถิติผู้เข้าชมเว็บไซต์:</span>
          </div>
          <div className="flex items-center gap-3 font-sarabun">
            <span>เข้าชมทั้งหมด <strong className="font-bold text-slate-800">{Number(totalVisits || 0).toLocaleString('th-TH')}</strong> ครั้ง</span>
            <span className="text-slate-300">|</span>
            <span>เดือนนี้ <strong className="font-bold text-slate-800">{Number(thisMonthVisits || 0).toLocaleString('th-TH')}</strong> ครั้ง</span>
          </div>
        </div>

        {/* Bottom Centered Copyright Bar */}
        <div className="pt-1 flex items-center justify-center text-center">
          <p className="text-xs text-slate-500 font-sarabun font-normal">
            {contact?.Copyright || `© ${currentYearBE} กองทรัพยากรมนุษย์ มหาวิทยาลัยศิลปากร (Silpakorn University)`}
          </p>
        </div>

      </div>
    </footer>
  );
};
