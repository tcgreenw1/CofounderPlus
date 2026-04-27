/**
 * AppleExternalPurchaseModal - iOS 17 compliant external purchase warning
 * Required for Apple App Store compliance when using external payment processing
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface AppleExternalPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export const AppleExternalPurchaseModal: React.FC<AppleExternalPurchaseModalProps> = ({
  isOpen,
  onClose,
  onContinue
}) => {
  console.log('🎭 AppleExternalPurchaseModal render - isOpen:', isOpen);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with dark blue vignette */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
            style={{
              background: 'radial-gradient(circle at center, rgba(0, 51, 102, 0.12) 0%, rgba(0, 20, 51, 0.4) 100%)',
              backdropFilter: 'blur(8px)'
            }}
            onClick={onClose}
          >
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1] // iOS spring curve
              }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[84%] sm:max-w-md"
              style={{
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(30px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden'
              }}
            >
              {/* Content Container */}
              <div className="relative p-6">
                {/* Title */}
                <h2 
                  className="text-center mb-4"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontSize: '19px',
                    fontWeight: 600,
                    color: '#1C1C1E',
                    letterSpacing: '-0.02em',
                    lineHeight: '1.3'
                  }}
                >
                  You're About to Leave the App
                </h2>

                {/* Body Text */}
                <p 
                  className="mb-6 px-5"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontSize: '15px',
                    fontWeight: 400,
                    color: '#3C3C43',
                    lineHeight: '1.47',
                    textAlign: 'center',
                    letterSpacing: '-0.01em'
                  }}
                >
                  You will be taken to an external website to complete your purchase. The developer is responsible for this transaction, including the security and privacy of your data. Apple is not responsible for purchases made outside of the App Store.
                </p>

                {/* Button Container */}
                <div className="flex flex-col gap-0">
                  {/* Divider */}
                  <div 
                    style={{
                      height: '0.5px',
                      background: 'rgba(60, 60, 67, 0.2)',
                      marginBottom: '0'
                    }}
                  />

                  {/* Buttons Row */}
                  <div className="flex">
                    {/* Cancel Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🚫 Apple modal - Cancel button clicked');
                        onClose();
                      }}
                      className="flex-1 relative"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontSize: '17px',
                        fontWeight: 500,
                        color: '#007AFF',
                        height: '48px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        letterSpacing: '-0.02em'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Cancel
                    </button>

                    {/* Vertical Divider */}
                    <div 
                      style={{
                        width: '0.5px',
                        background: 'rgba(60, 60, 67, 0.2)'
                      }}
                    />

                    {/* Continue Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('✅ Apple modal - Continue button clicked');
                        onContinue();
                      }}
                      className="flex-1 relative"
                      type="button"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontSize: '17px',
                        fontWeight: 600,
                        color: '#007AFF',
                        height: '48px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        letterSpacing: '-0.02em'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 122, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
