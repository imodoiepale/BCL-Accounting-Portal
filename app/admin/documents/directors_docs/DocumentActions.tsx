import React, { useState } from 'react';
import { Eye, MoreVertical } from 'lucide-react';

interface DocumentActionsProps {
  documentsCount: number;
  onView: () => void;
  onAdd: () => void;
}

const DocumentActions: React.FC<DocumentActionsProps> = ({
  documentsCount,
  onView,
  onAdd,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center justify-center space-x-1">
      <button
        onClick={onView}
        className="p-1 text-blue-600 hover:text-blue-800 relative"
        title="View Documents"
      >
        <Eye className="w-3 h-3" />
        {documentsCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {documentsCount}
          </span>
        )}
      </button>

      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-gray-600 hover:text-gray-800"
          title="More Options"
        >
          <MoreVertical className="w-3 h-3" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-50 border">
            <div className="py-1">
              <button
                onClick={() => {
                  onAdd();
                  setShowMenu(false);
                }}
                className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
              >
                Add Document
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentActions;