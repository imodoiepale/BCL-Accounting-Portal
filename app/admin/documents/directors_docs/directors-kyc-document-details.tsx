// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import {
  Eye,
  DownloadIcon,
  UploadIcon,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import toast, { Toaster } from "react-hot-toast";
import { DocumentActions } from "./DocumentComponents";
import {
  UploadModal,
  ViewModal,
  AddFieldsDialog,
  ExtractDetailsModal,
} from "./DocumentModals";
import * as XLSX from "xlsx";

// Interfaces
interface Director {
  id: bigint;
  company_id: bigint;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  full_name: string | null;
}

interface Upload {
  id: string;
  userid: string;
  kyc_document_id: string;
  filepath: string;
  issue_date: string;
  expiry_date?: string;
  value?: Record<string, any>;
  extracted_details?: Record<string, any>;
  created_at: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (
    file: File,
    extractOnUpload: boolean,
    onProgress?: (message: string) => void
  ) => void;
  director: Director;
  document: Document | null;
  isUploading: boolean;
}
interface Document {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  fields?: Array<{
    id: string;
    name: string;
    type: string;
    arrayConfig?: {
      fields: Array<{
        id: string;
        name: string;
      }>;
    };
  }>;
  last_extracted_details?: Record<string, any>;
}

interface ExtractedData {
  [key: string]: any;
}

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

interface AdvancedSearchFields {
  company_name?: string;
  director_name?: string;
  status?: "missing" | "completed" | "";
}

export default function DirectorsKycDocumentDetails() {
  // Basic state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [selectedDirectorUpload, setSelectedDirectorUpload] =
    useState<Director | null>(null);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [selectedExtractDocument, setSelectedExtractDocument] =
    useState<Document | null>(null);
  const [selectedExtractUpload, setSelectedExtractUpload] =
    useState<Upload | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "company_name",
    direction: "asc",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    general: false,
    "sheria-docs": false,
    "kra-docs": false,
  });

  // Version control state
  const [showAllVersions, setShowAllVersions] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState(new Set<number>());

  // Advanced search state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearchFields, setAdvancedSearchFields] =
    useState<AdvancedSearchFields>({
      company_name: "",
      director_name: "",
      status: "",
    });

  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Version control functions
  const toggleCompanyVersions = (companyId: number) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }
      return next;
    });
  };

  const toggleAllVersions = () => {
    setShowAllVersions((prev) => !prev);
    setExpandedCompanies(new Set());
  };

  // Core data fetching queries
  const { data: directors = [], isLoading: isLoadingDirectors } = useQuery({
    queryKey: ["directors"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("acc_portal_directors_duplicate")
          .select(
            `
            id,
            company_id,
            first_name,
            middle_name,
            last_name,
            full_name
          `
          )
          .order("company_id");

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching directors:", error);
        toast.error("Failed to load directors");
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Add this with your other event handlers
  const handleUploadClick = (
    directorId: string | bigint,
    documentId: string
  ) => {
    if (!directorId || !documentId || !selectedDocument) {
      toast.error("Invalid upload parameters");
      return;
    }

    const selectedDirector = directors.find(
      (d) => d.id.toString() === directorId.toString()
    );

    if (!selectedDirector) {
      toast.error("Director not found");
      return;
    }

    // No need to find document here as we already have selectedDocument
    setSelectedDirectorUpload(selectedDirector);
    setShowUploadModal(true);
  };

  // Group directors by company
  const directorsByCompany = useMemo(() => {
    return directors.reduce((acc, director) => {
      if (!acc[director.company_id]) {
        acc[director.company_id] = [];
      }
      acc[director.company_id].push(director);
      return acc;
    }, {});
  }, [directors]);

  // Companies query
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companies", debouncedSearch],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("acc_portal_company_duplicate")
          .select("id, company_name")
          .ilike("company_name", `%${debouncedSearch}%`)
          .limit(100);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching companies:", error);
        toast.error("Failed to load companies");
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Documents query
  // Documents query
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("acc_portal_kyc")
          .select("*")
          .eq("category", "directors-docs");

        if (error) throw error;

        // Convert data to object format
        const docsByCategory = {};
        (data || []).forEach((doc) => {
          const category =
            doc.subcategory === "EMPTY" ? "general" : doc.subcategory;
          if (!docsByCategory[category]) {
            docsByCategory[category] = [];
          }
          docsByCategory[category].push(doc);
        });

        return docsByCategory;
      } catch (error) {
        console.error("Error fetching documents:", error);
        return {};
      }
    },
  });

  // Uploads query
  const { data: uploads = [], isLoading: isLoadingUploads } = useQuery({
    queryKey: ["uploads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("acc_portal_directors_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
  // Utility Functions
  const isImageFile = (filepath: string): boolean => {
    if (!filepath) return false;
    const extension = filepath.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png"].includes(extension || "");
  };

  // Status counting function
  const getStatusCounts = () => {
    let missing = 0;
    let completed = 0;

    Object.values(directorsByCompany)
      .flat()
      .forEach((director) => {
        const hasUpload = uploads.some(
          (u) =>
            u.kyc_document_id === selectedDocument?.id &&
            u.userid === director.id.toString()
        );

        if (hasUpload) {
          completed++;
        } else {
          missing++;
        }
      });

    return { missing, completed };
  };

  // Enhanced filtering and sorting functions
  const filterCompanies = (companies: any[]) => {
    if (!companies || !selectedDocument) return [];

    return companies.filter((company) => {
      const companyDirectors = directorsByCompany[company.id] || [];

      // Basic company name filter
      const matchesCompanyName = company.company_name
        .toLowerCase()
        .includes((advancedSearchFields.company_name || "").toLowerCase());

      // Director name filter - only if director name search is provided
      const matchesDirectorName =
        !advancedSearchFields.director_name ||
        companyDirectors.some((director) => {
          const directorName = `${director.first_name || ""} ${
            director.last_name || ""
          } ${director.full_name || ""}`.toLowerCase();
          return directorName.includes(
            advancedSearchFields.director_name.toLowerCase()
          );
        });

      // Status filter - only if status filter is provided
      const matchesStatus =
        !advancedSearchFields.status ||
        companyDirectors.some((director) => {
          const hasUpload = uploads.some(
            (u) =>
              u.kyc_document_id === selectedDocument?.id &&
              u.userid === director.id.toString()
          );
          return (
            advancedSearchFields.status ===
            (hasUpload ? "completed" : "missing")
          );
        });

      return matchesCompanyName && matchesDirectorName && matchesStatus;
    });
  };

  const sortDirectors = (directors: Director[]) => {
    if (sortConfig.key !== "director_name") return directors;

    return [...directors].sort((a, b) => {
      const aName = a.full_name || `${a.first_name || ""} ${a.last_name || ""}`;
      const bName = b.full_name || `${b.first_name || ""} ${b.last_name || ""}`;

      return sortConfig.direction === "asc"
        ? aName.localeCompare(bName)
        : bName.localeCompare(aName);
    });
  };

  const sortByStatus = (directors: Director[]) => {
    if (sortConfig.key !== "status") return directors;

    return [...directors].sort((a, b) => {
      const aHasUpload = uploads.some(
        (u) =>
          u.kyc_document_id === selectedDocument?.id &&
          u.userid === a.id.toString()
      );
      const bHasUpload = uploads.some(
        (u) =>
          u.kyc_document_id === selectedDocument?.id &&
          u.userid === b.id.toString()
      );

      if (aHasUpload === bHasUpload) return 0;
      return sortConfig.direction === "asc"
        ? aHasUpload
          ? 1
          : -1
        : aHasUpload
        ? -1
        : 1;
    });
  };

  // Export function
  const handleExportToExcel = () => {
    if (!selectedDocument || !filteredAndSortedCompanies.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const exportData = filteredAndSortedCompanies.flatMap((company) => {
        const companyDirectors = directorsByCompany[company.id] || [];

        return companyDirectors.map((director) => {
          const upload = uploads.find(
            (u) =>
              u.kyc_document_id === selectedDocument.id &&
              u.userid === director.id.toString()
          );

          const rowData: any = {
            "Company Name": company.company_name,
            "Director Name":
              director.full_name ||
              `${director.first_name || ""} ${director.last_name || ""}`,
            Status: upload ? "Completed" : "Missing",
            "Upload Date": upload?.created_at
              ? new Date(upload.created_at).toLocaleDateString()
              : "-",
          };

          selectedDocument.fields?.forEach((field) => {
            rowData[field.name] =
              upload?.extracted_details?.[field.name] || "-";
          });

          return rowData;
        });
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Directors Documents");

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `directors_documents_${selectedDocument.name}_${timestamp}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success("Export completed successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  // Mutations
  const updateFieldsMutation = useMutation({
    mutationFn: async ({ documentId, fields }) => {
      const { error } = await supabase
        .from("acc_portal_kyc")
        .update({ fields })
        .eq("id", documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["documents"]);
      toast.success("Fields updated successfully");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      directorId,
      documentId,
      file,
      extractOnUpload,
      onProgress,
    }) => {
      setIsLoading(true);
      try {
        const timestamp = new Date().getTime();
        const fileName = `directors/${directorId}/${documentId}/${timestamp}_${file.name}`;

        onProgress?.("Uploading file...");

        const { data: fileData, error: uploadError } = await supabase.storage
          .from("kyc-documents")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const uploadData = {
          userid: directorId.toString(),
          kyc_document_id: documentId,
          filepath: fileData.path,
          created_at: new Date().toISOString(),
        };

        const { data: uploadResult, error: insertError } = await supabase
          .from("acc_portal_directors_documents")
          .insert(uploadData)
          .select()
          .single();

        if (insertError) throw insertError;

        if (extractOnUpload) {
          // Find document in the grouped structure
          const selectedDoc = Object.values(documents)
            .flat()
            .find((d) => d.id === documentId);

          setSelectedExtractDocument(selectedDoc || null);
          setSelectedExtractUpload(uploadResult);
          setShowExtractModal(true);
        }

        return uploadResult;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["uploads"]);
      setShowUploadModal(false);
      toast.success("Document uploaded successfully");
    },
    onError: (error) => {
      toast.error("Upload failed");
      console.error("Upload error:", error);
    },
  });

  // Event Handlers
  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleViewDocument = async (document: Document, director: Director) => {
    try {
      const upload = uploads.find(
        (u) =>
          u.kyc_document_id === document.id &&
          u.userid === director.id.toString()
      );

      if (!upload) {
        toast.error("Document not found");
        return;
      }

      const { data, error } = await supabase.storage
        .from("kyc-documents")
        .createSignedUrl(upload.filepath, 60);

      if (error) throw error;

      setViewUrl(data.signedUrl);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error("Failed to view document");
    }
  };

  const handleExtractClick = (document: Document, upload: Upload) => {
    if (!document || !upload) {
      toast.error("Invalid extraction parameters");
      return;
    }
    setSelectedExtractDocument(document);
    setSelectedExtractUpload(upload);
    setShowExtractModal(true);
  };

  const handleExtractComplete = async (extractedData: ExtractedData) => {
    try {
      if (!selectedExtractUpload?.id) {
        throw new Error("No upload selected");
      }

      const { error } = await supabase
        .from("acc_portal_directors_documents")
        .update({ extracted_details: extractedData })
        .eq("id", selectedExtractUpload.id);

      if (error) throw error;

      queryClient.invalidateQueries(["uploads"]);
      setShowExtractModal(false);
      setSelectedExtractDocument(null);
      setSelectedExtractUpload(null);
      toast.success("Details extracted successfully");
    } catch (error) {
      console.error("Extraction error:", error);
      toast.error("Failed to save extracted details");
    }
  };

  const renderFieldValue = (field: any, value: any) => {
    if (field.type === "array" && Array.isArray(value)) {
      return (
        <div className="min-w-[800px]">
          <div className="border rounded-sm w-full">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {field.arrayConfig?.fields?.map((subField: any) => (
                    <th
                      key={subField.id}
                      className="text-[8px] font-medium text-gray-600 p-2 border-r last:border-r-0"
                    >
                      {subField.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {value.length === 0 ? (
                  <tr>
                    <td
                      colSpan={field.arrayConfig?.fields?.length || 1}
                      className="text-[9px] text-gray-500 text-center p-2"
                    >
                      No items
                    </td>
                  </tr>
                ) : (
                  value.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      {field.arrayConfig?.fields?.map((subField: any) => (
                        <td
                          key={subField.id}
                          className="text-[9px] p-2 border-r last:border-r-0 whitespace-normal"
                        >
                          <div className="text-left">
                            {item[subField.name] || "-"}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="text-[9px] min-w-[150px] max-w-[200px] px-2">
        <div className="line-clamp-2 text-left break-words">
          {value ? String(value) : "-"}
        </div>
      </div>
    );
  };

  // Computed Values
  const filteredAndSortedCompanies = useMemo(() => {
    return filterCompanies(companies);
  }, [
    companies,
    advancedSearchFields,
    selectedDocument,
    uploads,
    directorsByCompany,
  ]);

  // Return the main component UI
  return (
    <div className="flex overflow-hidden">
      <Toaster position="top-right" />

      {/* Left Sidebar - Document Categories */}
      <div className="w-1/5 min-w-[200px] border-r overflow-hidden flex flex-col">
        <div className="p-2">
          <h2 className="text-sm font-bold mb-2">Director Documents</h2>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2 h-8 text-xs pl-8"
            />
            <Search className="h-4 w-4 absolute left-2 top-2 text-gray-400" />
          </div>
        </div>

        <div ref={parentRef} className="overflow-y-auto flex-1">
          {isLoadingDocuments ? (
            <div className="p-2 text-xs">Loading documents...</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(documents || {}).map(([category, docs]) => (
                <div key={category} className="border-b last:border-b-0">
                  <div
                    className="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      setExpandedCategories((prev) => ({
                        ...prev,
                        [category]: !prev[category],
                      }))
                    }
                  >
                    {expandedCategories[category] ? (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs font-semibold capitalize">
                      {category.replace("-", " ")} Documents
                    </span>
                  </div>
                  {expandedCategories[category] && Array.isArray(docs) && (
                    <ul className="pl-6">
                      {docs.map((doc) => (
                        <li
                          key={doc.id}
                          className={`px-2 py-1 rounded flex items-center justify-between text-xs ${
                            selectedDocument?.id === doc.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <span
                            className="cursor-pointer flex-1"
                            onClick={() => setSelectedDocument(doc)}
                          >
                            {doc.name}
                          </span>
                          {/* Uncomment when DocumentActions component is available */}
                          {/* <DocumentActions
                    document={doc}
                    onAddField={() => {
                      setSelectedDocument(doc);
                      setIsAddFieldOpen(true);
                    }}
                    onUpdateFields={(documentId, fields) => {
                      updateFieldsMutation.mutate({ documentId, fields });
                    }}
                  /> */}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-[800px] overflow-hidden">
        {selectedDocument ? (
          <div className="flex flex-col h-full">
            {/* Header Section */}
            <div className="p-2 border-b space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">
                  {selectedDocument.name}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    (Director Documents)
                  </span>
                </h2>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportToExcel}
                    className="text-xs flex items-center"
                    disabled={
                      !selectedDocument ||
                      filteredAndSortedCompanies.length === 0
                    }
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export to Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className="text-xs flex items-center"
                  >
                    <Search className="h-3 w-3 mr-1" />
                    {showAdvancedSearch ? "Hide Search" : "Advanced Search"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAllVersions}
                    className="text-xs"
                  >
                    {showAllVersions ? "Hide Versions" : "Show All Versions"}
                  </Button>
                </div>
              </div>

              {/* Advanced Search */}
              {showAdvancedSearch && (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Company Name..."
                    className="text-xs"
                    value={advancedSearchFields.company_name}
                    onChange={(e) =>
                      setAdvancedSearchFields((prev) => ({
                        ...prev,
                        company_name: e.target.value,
                      }))
                    }
                  />
                  <Input
                    type="text"
                    placeholder="Director Name..."
                    className="text-xs"
                    value={advancedSearchFields.director_name}
                    onChange={(e) =>
                      setAdvancedSearchFields((prev) => ({
                        ...prev,
                        director_name: e.target.value,
                      }))
                    }
                  />
                  <select
                    className="text-xs border rounded px-2"
                    value={advancedSearchFields.status}
                    onChange={(e) =>
                      setAdvancedSearchFields((prev) => ({
                        ...prev,
                        status: e.target.value as "missing" | "completed" | "",
                      }))
                    }
                  >
                    <option value="">All Status</option>
                    <option value="missing">Missing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}

              {/* Statistics */}
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded">
                  <span className="font-medium">Missing Documents:</span>
                  <span className="text-red-500 font-bold">
                    {getStatusCounts().missing}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded">
                  <span className="font-medium">Completed Documents:</span>
                  <span className="text-green-500 font-bold">
                    {getStatusCounts().completed}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded">
                  <span className="font-medium">Total Directors:</span>
                  <span className="text-blue-500 font-bold">
                    {Object.values(directorsByCompany).flat().length}
                  </span>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="overflow-auto flex-1">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow className="text-[10px] bg-blue-50">
                      <TableHead className="w-12 sticky top-0 left-0 bg-blue-50 z-10">
                        #
                      </TableHead>
                      <TableHead
                        className="sticky top-0 left-0 bg-blue-50 z-10 cursor-pointer"
                        onClick={() => handleSort("company_name")}
                      >
                        <div className="flex items-center">
                          Company
                          <ArrowUpDown className="h-3 w-3 ml-1" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="sticky top-0 bg-blue-50 z-10 cursor-pointer"
                        onClick={() => handleSort("director_name")}
                      >
                        <div className="flex items-center">
                          Director
                          <ArrowUpDown className="h-3 w-3 ml-1" />
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-blue-50 z-10 w-28">
                        Actions
                      </TableHead>
                      {selectedDocument.fields?.map((field) => (
                        <TableHead
                          key={field.id}
                          className="sticky top-0 bg-blue-50 z-10"
                        >
                          {field.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedCompanies.map((company, companyIndex) => {
                      // Get all directors for this company
                      const companyDirectors = sortByStatus(
                        sortDirectors(directorsByCompany[company.id] || [])
                      );

                      // Return directly if no directors
                      if (companyDirectors.length === 0) {
                        return (
                          <TableRow key={`${company.id}-empty`}>
                            <TableCell>{companyIndex + 1}</TableCell>
                            <TableCell>{company.company_name}</TableCell>
                            <TableCell colSpan={3}>
                              No directors found
                            </TableCell>
                          </TableRow>
                        );
                      }

                      // Map each director to a row
                      return companyDirectors.map((director, directorIndex) => {
                        const directorUploads = uploads.filter(
                          (u) =>
                            u.kyc_document_id === selectedDocument?.id &&
                            u.userid === director.id.toString()
                        );

                        const isExpanded = expandedCompanies.has(company.id);
                        const hasUploads = directorUploads.length > 0;
                        const visibleUploads =
                          showAllVersions || isExpanded
                            ? directorUploads
                            : directorUploads.slice(0, 1);

                        return (
                          <TableRow
                            key={`${company.id}-${director.id}`}
                            className={`
            text-[11px]
            ${
              directorIndex === companyDirectors.length - 1
                ? "border-b-2"
                : "border-b"
            }
            ${hasUploads ? "bg-green-50/30" : "bg-red-50/20"}
          `}
                          >
                            {/* Company info - only shown for first director */}
                            {directorIndex === 0 && (
                              <>
                                <TableCell
                                  className="font-medium"
                                  rowSpan={companyDirectors.length}
                                >
                                  {companyIndex + 1}
                                </TableCell>
                                <TableCell
                                  className="font-medium"
                                  rowSpan={companyDirectors.length}
                                >
                                  <div className="flex items-center gap-2">
                                    {company.company_name}
                                    {hasUploads &&
                                      directorUploads.length > 1 && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            toggleCompanyVersions(company.id)
                                          }
                                          className="h-6 w-6 p-0"
                                        >
                                          {isExpanded ? (
                                            <ChevronUp className="h-4 w-4" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4" />
                                          )}
                                        </Button>
                                      )}
                                    <span className="text-[10px] text-gray-500">
                                      ({companyDirectors.length}{" "}
                                      {companyDirectors.length === 1
                                        ? "Director"
                                        : "Directors"}
                                      )
                                    </span>
                                  </div>
                                </TableCell>
                              </>
                            )}

                            {/* Director info - shown for each director */}
                            <TableCell className="border-l">
                              <div className="text-[11px]">
                                {director.full_name ||
                                  `${director.first_name || ""} ${
                                    director.last_name || ""
                                  }`}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {hasUploads ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleViewDocument(
                                          selectedDocument,
                                          director
                                        )
                                      }
                                      className="h-6 w-6"
                                    >
                                      <Eye className="h-3 w-3 text-blue-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleExtractClick(
                                          selectedDocument,
                                          directorUploads[0]
                                        )
                                      }
                                      className="h-6 w-6"
                                    >
                                      <DownloadIcon className="h-3 w-3 text-green-500" />
                                    </Button>
                                    {visibleUploads.length > 1 && (
                                      <span className="text-[9px] text-green-600">
                                        ({directorUploads.length} versions)
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleUploadClick(
                                        director.id,
                                        selectedDocument?.id
                                      )
                                    }
                                    className="h-6 w-6"
                                  >
                                    <UploadIcon className="h-3 w-3 text-orange-500" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>

                            {/* Document fields */}
                            {selectedDocument?.fields?.map((field) => (
                              <TableCell key={field.id} className="border-l">
                                {hasUploads
                                  ? renderFieldValue(
                                      field,
                                      directorUploads[0]?.extracted_details?.[
                                        field.name
                                      ]
                                    )
                                  : "-"}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      });
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Select a document to view details
          </div>
        )}
      </div>

      {/* Modals */}
      {showUploadModal && selectedDirectorUpload && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedDirectorUpload(null);
          }}
          onUpload={(file, extractOnUpload, onProgress) =>
            uploadMutation.mutate({
              directorId: selectedDirectorUpload.id,
              documentId: selectedDocument?.id,
              file,
              extractOnUpload,
              onProgress,
            })
          }
          director={selectedDirectorUpload}
          document={selectedDocument}
          isUploading={isLoading}
        />
      )}

      {showViewModal && viewUrl && (
        <ViewModal
          url={viewUrl}
          onClose={() => {
            setShowViewModal(false);
            setViewUrl(null);
          }}
        />
      )}

      {isAddFieldOpen && selectedDocument && (
        <AddFieldsDialog
          isOpen={isAddFieldOpen}
          onClose={() => setIsAddFieldOpen(false)}
          document={selectedDocument}
          onSubmit={(documentId, fields) => {
            const existingFields = selectedDocument.fields || [];
            const updatedFields = [...existingFields, ...fields];
            updateFieldsMutation.mutate({ documentId, fields: updatedFields });
            setIsAddFieldOpen(false);
          }}
        />
      )}

      {showExtractModal && selectedExtractDocument && selectedExtractUpload && (
        <ExtractDetailsModal
          isOpen={showExtractModal}
          onClose={() => {
            setShowExtractModal(false);
            setSelectedExtractDocument(null);
            setSelectedExtractUpload(null);
          }}
          document={selectedExtractDocument}
          upload={selectedExtractUpload}
          onSubmit={handleExtractComplete}
        />
      )}
    </div>
  );
}