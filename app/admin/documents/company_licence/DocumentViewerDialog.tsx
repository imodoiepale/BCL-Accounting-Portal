import React from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileIcon,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentViewerDialogProps {
  documents: any[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  onClose: () => void;
  handleDeleteClick: (id: string) => void;
  handleDocumentTypeChange: (id: string, type: "recent" | "past") => void;
  getFilenameFromPath: (filepath: string) => string;
  sortedDocs: any[];
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  deletingDoc: string | null;
  setDeletingDoc: (id: string | null) => void;
  handleConfirmDelete: () => void;
  isDeleting: boolean;
  documentName?: string;
  companyName?: string;
}

export const DocumentViewerDialog: React.FC<DocumentViewerDialogProps> = ({
  documents,
  currentIndex,
  setCurrentIndex,
  onClose,
  handleDeleteClick,
  handleDocumentTypeChange,
  getFilenameFromPath,
  sortedDocs,
  showDeleteConfirm,
  setShowDeleteConfirm,
  deletingDoc,
  setDeletingDoc,
  handleConfirmDelete,
  isDeleting,
  documentName,
  companyName,
}) => {
  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent
          className={`max-w-[98vw] w-[1600px] max-h-[99vh] ${
            documents.length === 1 ? "h-[99vh]" : "h-[99vh]"
          }`}
        >
          <DialogHeader className="px-6 py-2">
            <DialogTitle className="flex justify-between items-center">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{documentName}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600">{companyName}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">
                    Document {currentIndex + 1} of {documents.length}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-sm text-gray-500">
                    {getFilenameFromPath(sortedDocs[currentIndex].filepath)}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="hover:bg-violet-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentIndex(Math.min(documents.length - 1, currentIndex + 1))
                  }
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
                        index === currentIndex
                          ? "border-violet-500 bg-violet-50"
                          : "border-gray-200 hover:border-violet-200"
                      }`}
                      onClick={() => setCurrentIndex(index)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-violet-500" />
                          <span className="text-sm font-medium truncate">
                            {getFilenameFromPath(doc.filepath)}
                          </span>
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
                      <div className="space-y-1 mt-2">
                        <div className="text-xs text-gray-500">
                          Uploaded: {format(new Date(doc.uploadDate), "dd/MM/yyyy")}
                        </div>
                        {doc.issueDate && (
                          <div className="text-xs text-gray-500">
                            Issued: {format(new Date(doc.issueDate), "dd/MM/yyyy")}
                          </div>
                        )}
                        {doc.expiryDate && (
                          <div className="text-xs text-gray-500">
                            Expires: {format(new Date(doc.expiryDate), "dd/MM/yyyy")}
                          </div>
                        )}
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
                style={{ height: "calc(99vh - 70px)" }}
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
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this document? This action cannot
              be undone.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {deletingDoc &&
                sortedDocs
                  .find((doc) => doc.id === deletingDoc)
                  ?.filepath.split("/")
                  .pop()}
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
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};