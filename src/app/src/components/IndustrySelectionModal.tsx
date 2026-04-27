import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import IndustrySelector from './IndustrySelector';
import { X } from 'lucide-react';

interface IndustrySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (industryId: string, industryTitle: string) => void;
  selectedIndustry?: string;
}

export const IndustrySelectionModal: React.FC<IndustrySelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedIndustry
}) => {
  const handleSelect = (industryId: string, industryTitle: string) => {
    onSelect(industryId, industryTitle);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-3 py-2 sm:p-6 pb-2 sm:pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base sm:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Choose Your Industry
              </DialogTitle>
              <DialogDescription className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                choose from 108 available industries
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-3 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          <IndustrySelector
            onSelect={handleSelect}
            selectedIndustry={selectedIndustry}
            showSearch={true}
            showCategories={true}
            maxHeight="100%"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
