import React from 'react';
import { X } from 'lucide-react';

interface SettingsModalProps {
  documents: any[];
  visibleColumns: any;
  setVisibleColumns: React.Dispatch<React.SetStateAction<any>>;
  setShowSettingsModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  documents,
  visibleColumns,
  setVisibleColumns,
  setShowSettingsModal,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full h-[80vh] max-w-6xl relative flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Settings</h2>
        <button
          onClick={() => setShowSettingsModal(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-auto flex-1">
        <div className="grid grid-cols-3 gap-4 min-w-[800px] pb-4">
          {documents.map((doc) => (
            <div key={doc.id} className="border p-4 rounded-lg bg-gray-50">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={visibleColumns[doc.id]?.visible}
                  onChange={() => {
                    setVisibleColumns((prev: { [x: string]: { visible: any; }; }) => ({
                      ...prev,
                      [doc.id]: {
                        ...prev[doc.id],
                        visible: !prev[doc.id]?.visible,
                      },
                    }));
                  }}
                  className="mr-2 h-4 w-4"
                />
                <label className="text-sm font-medium text-gray-700">
                  {doc.name}
                </label>
              </div>
              {visibleColumns[doc.id]?.visible && (
                <div className="space-y-2 pl-6">
                  {Object.keys(visibleColumns[doc.id]?.subColumns || {}).map(
                    (subColumn) => (
                      <div key={subColumn} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={visibleColumns[doc.id]?.subColumns[subColumn]}
                          onChange={() => {
                            setVisibleColumns((prev: { [x: string]: { subColumns: { [x: string]: any; }; }; }) => ({
                              ...prev,
                              [doc.id]: {
                                ...prev[doc.id],
                                subColumns: {
                                  ...prev[doc.id]?.subColumns,
                                  [subColumn]: !prev[doc.id]?.subColumns[subColumn],
                                },
                              },
                            }));
                          }}
                          className="mr-2 h-4 w-4"
                        />
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {subColumn}
                        </label>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);