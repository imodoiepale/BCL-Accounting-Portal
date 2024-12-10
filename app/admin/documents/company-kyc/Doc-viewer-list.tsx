import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DocumentViewerProps {
  url: string;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, onClose }) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] h-[800px] p-0">
        <div className="h-full flex flex-col bg-white">
          <div className="flex justify-between items-center p-4 border-b border-slate-200">
            <h2 className="font-semibold text-lg text-slate-800">Document Preview</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 relative bg-slate-100">
            <iframe
              src={url}
              className="w-full h-full absolute inset-0"
              title="Document Viewer"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};