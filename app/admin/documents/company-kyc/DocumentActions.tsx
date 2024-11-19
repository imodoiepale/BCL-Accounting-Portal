// DocumentActions.tsx
import React from 'react';
import { MoreVertical, Eye, Upload, Download } from 'lucide-react';

interface DocumentActionsProps {
  upload: typeof Upload;
  onView: () => void;
  onUpdate: () => void;
  onDownload: () => void;
}
export const DocumentActions: React.FC<DocumentActionsProps> = ({
  upload,
  onView,
  onUpdate,
  onDownload
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-100 rounded-full"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => {
                onView();
                setIsOpen(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </button>
            <button
              onClick={() => {
                onUpdate();
                setIsOpen(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Update
            </button>
            <button
              onClick={() => {
                onDownload();
                setIsOpen(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};