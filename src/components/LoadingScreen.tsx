import React from 'react';
import { motion } from 'motion/react';

interface LoadingScreenProps {
  logoUrl?: string;
  siteName?: string;
  subSiteName?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  logoUrl = "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Silpakorn_University.svg"
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md select-none p-6"
    >
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Radial Glow */}
        <motion.div
          animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-emerald-100/80 blur-2xl pointer-events-none"
        />

        {/* Minimal Animated Logo Container */}
        <motion.div
          animate={{ scale: [0.96, 1.04, 0.96] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center"
        >
          <img
            src={logoUrl || "https://upload.wikimedia.org/wikipedia/commons/5/54/Logo_of_Silpakorn_University.svg"}
            alt="Silpakorn University Logo"
            className="w-full h-full object-contain drop-shadow-sm"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

