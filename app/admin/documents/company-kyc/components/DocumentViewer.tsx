import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, FileIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DocumentViewerProps {
  documents: any[];
  onClose: () => void;
  onUpdateDocumentType?: (docId: string, type: 'recent' | 'past') => Promise<void>;
  onDelete?: (docId: string) => Promise<void>;
  companyName: string;
  documentName: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  documents, 
  onClose, 
  onUpdateDocumentType, 
  onDelete,
  companyName,
  documentName 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedDocs = [...documents].sort((a, b) =>
    new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  );

  const getFilenameFromPath = (filepath: string) => {
    return filepath.split('/').pop() || 'Unnamed Document';
  };

  const handleDocumentTypeChange = async (docId: string, type: 'recent' | 'past') => {
    try {
      if (onUpdateDocumentType) {
        await onUpdateDocumentType(docId, type);
      }
    } catch (error) {
      toast.error('Failed to update document type');
    }
  };

  const handleDeleteClick = (docId: string) => {
    setDeletingDoc(docId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDoc || !onDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(deletingDoc);

      if (documents.length === 1) {
        onClose();
      } else {
        setCurrentIndex(prev => prev === documents.length - 1 ? prev - 1 : prev);
      }
      toast.success('Document deleted successfully');
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingDoc(null);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className={`max-w-[98vw] w-[1600px] max-h-[99vh] ${documents.length === 1 ? 'h-[99vh]' : 'h-[99vh]'}`}>
          <DialogHeader className="px-6 py-2">
            <DialogTitle className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold">{companyName}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-violet-600">{documentName}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-500">Document Preview ({currentIndex + 1}/{documents.length})</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-500">
                      {getFilenameFromPath(sortedDocs[currentIndex].filepath)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="hover:bg-violet-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentIndex(prev => Math.min(documents.length - 1, prev + 1))}
                    disabled={currentIndex === documents.length - 1}
                    className="hover:bg-violet-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(sortedDocs[currentIndex].id)}
                    className="hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 h-[calc(100%-60px)] p-2">
            <div className="w-[250px] flex flex-col border-r pr-3">
              <ScrollArea className="flex-1">
                <div className="space-y-3">
                  {sortedDocs.map((doc, index) => (
                    <div
                      key={doc.id}
                      className={`cursor-pointer p-3 border rounded-lg transition-all group ${
                        index === currentIndex ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-200'
                      }`}
                      onClick={() => setCurrentIndex(index)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 relative">
                          <FileIcon className="h-4 w-4 text-violet-500 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {getFilenameFromPath(doc.filepath)}
                          </span>
                          <div className="absolute left-0 -bottom-8 hidden group-hover:block z-50">
                            <div className="bg-gray-900 text-white text-xs rounded-md py-1 px-2 whitespace-nowrap">
                              {getFilenameFromPath(doc.filepath)}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(doc.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Select
                          defaultValue={doc.documentType || 'recent'}
                          onValueChange={(value) => handleDocumentTypeChange(doc.id, value as 'recent' | 'past')}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recent" className="text-xs">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Recent Document
                              </span>
                            </SelectItem>
                            <SelectItem value="past" className="text-xs">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Past Document
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="space-y-1 mt-2">
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="font-medium">Uploaded:</span>
                            {format(new Date(doc.uploadDate), 'dd/MM/yyyy')}
                          </div>
                          {doc.issueDate && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <span className="font-medium">Issued:</span>
                              {format(new Date(doc.issueDate), 'dd/MM/yyyy')}
                            </div>
                          )}
                          {doc.expiryDate && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <span className="font-medium">Expires:</span>
                              {format(new Date(doc.expiryDate), 'dd/MM/yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden bg-white">
              <iframe
                src={sortedDocs[currentIndex].url}
                className="w-full h-full"
                title={getFilenameFromPath(sortedDocs[currentIndex].filepath)}
                style={{ height: 'calc(99vh - 70px)' }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700">Are you sure you want to delete this document? This action cannot be undone.</p>
            <p className="text-sm text-gray-500 mt-2">
              {deletingDoc && sortedDocs.find(doc => doc.id === deletingDoc)?.filepath.split('/').pop()}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingDoc(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};