import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface DocumentViewerProps {
  documents: Array<{
    id: number;
    url: string;
    filename: string;
    uploadDate: Date;
    issueDate?: Date;
    
    expiryDate?: Date;
  }>;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ documents, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sortedDocs = [...documents].sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Document Preview ({currentIndex + 1}/{documents.length})</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(prev => Math.min(documents.length - 1, prev + 1))}
                disabled={currentIndex === documents.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex-1 min-h-[500px] bg-gray-50 rounded-lg">
            <iframe src={sortedDocs[currentIndex].url} className="w-full h-full rounded-lg" />
          </div>
          <div className="grid grid-cols-4 gap-2 max-h-[150px] overflow-y-auto p-2">
            {sortedDocs.map((doc, index) => (
              <div
                key={doc.id}
                className={`cursor-pointer p-2 border rounded ${
                  index === currentIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <div className="text-xs truncate">{doc.filename}</div>
                <div className="text-xs text-gray-500">
                  {format(doc.uploadDate, 'dd/MM/yyyy HH:mm')}
                </div>
                {doc.issueDate && (
                  <div className="text-xs text-gray-500">
                    Issue: {format(doc.issueDate, 'dd/MM/yyyy')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};