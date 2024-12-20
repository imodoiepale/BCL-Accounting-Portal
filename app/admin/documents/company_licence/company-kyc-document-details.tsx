// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  RefreshCw,
  Search,
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
import { useVersionControl, VersionSettings } from "./versionControl";

export default function CompanyKycDocumentDetails() {
  // Existing state
  const [searchTerm, setSearchTerm] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [selectedUploadCompany, setSelectedUploadCompany] =
    useState<Company | null>(null);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [selectedExtractDocument, setSelectedExtractDocument] =
    useState<Document | null>(null);
  const [selectedExtractUpload, setSelectedExtractUpload] =
    useState<Upload | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedCategories, setExpandedCategories] = useState({
    general: false,
    "sheria-docs": false,
    "kra-docs": false,
  });

  const { refetch: refetchCompanies, isRefetching: isRefetchingCompanies } =
    useQuery({
      queryKey: ["companies", debouncedSearch],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("acc_portal_company_duplicate")
          .select("id, company_name")
          .ilike("company_name", `%${debouncedSearch}%`)
          .limit(100);

        if (error) throw error;
        return data || [];
      },
      staleTime: 1000 * 60 * 5,
      refetchInterval: 1000 * 60 * 5, // Auto refresh every 5 minutes
    });

  const { refetch: refetchDocuments, isRefetching: isRefetchingDocuments } =
    useQuery({
      queryKey: ["documents"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("acc_portal_licence")
          .select("*");

        if (error) throw error;
        return data || [];
      },
      staleTime: 1000 * 60 * 5,
      refetchInterval: 1000 * 60 * 5,
    });

  const { refetch: refetchUploads, isRefetching: isRefetchingUploads } =
    useQuery({
      queryKey: ["uploads"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("acc_portal_licence_uploads")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const imageUploads = (data || []).filter((upload) =>
          isImageFile(upload.filepath)
        );

        return imageUploads.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        });
      },
      staleTime: 1000 * 60 * 5,
      refetchInterval: 1000 * 60 * 5,
    });

  // Add version control
  const {
    expandedCompanies,
    showAllVersions,
    toggleCompanyVersions,
    toggleAllVersions,
  } = useVersionControl();

  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);

  // Debounced Search Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Companies Query
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companies", debouncedSearch],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("acc_portal_company_duplicate")
        .select("id, company_name")
        .ilike("company_name", `%${debouncedSearch}%`)
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Documents Query
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("acc_portal_licence")
        .select("*");

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  // Uploads Query
  const { data: uploads = [], isLoading: isLoadingUploads } = useQuery({
    queryKey: ["uploads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("acc_portal_licence_uploads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter to only include image files and properly handle licence_document_id
      const imageUploads = (data || [])
        .filter((upload) => isImageFile(upload.filepath))
        .map((upload) => ({
          ...upload,
          kyc_document_id: upload.licence_document_id, // Map licence_document_id to kyc_document_id for consistency
        }));

      return imageUploads.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  // Update Fields Mutation
  // Update the mutation configurations to automatically refetch data
  const updateFieldsMutation = useMutation({
    mutationFn: async ({ documentId, fields }) => {
      const { data, error } = await supabase
        .from("acc_portal_licence")
        .update({ fields })
        .eq("id", documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries(["documents"]),
        queryClient.invalidateQueries(["uploads"]),
      ]);
      toast.success("Fields updated successfully");
    },
  });

  const handleRefresh = async () => {
    try {
      toast.promise(
        Promise.all([refetchCompanies(), refetchDocuments(), refetchUploads()]),
        {
          loading: "Refreshing data...",
          success: "Data refreshed successfully",
          error: "Failed to refresh data",
        }
      );
    } catch (error) {
      console.error("Refresh error:", error);
    }
  };

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async ({
      companyId,
      documentId,
      file,
      extractOnUpload,
      onProgress,
    }) => {
      try {
        onProgress?.("Uploading file...");
        const timestamp = new Date().getTime();
        const fileName = `${companyId}/${documentId}/${timestamp}_${file.name}`;

        const { data: fileData, error: fileError } = await supabase.storage
          .from("licence_documents")
          .upload(fileName, file);

        if (fileError) throw fileError;

        const uploadData = {
          userid: companyId.toString(),
          licence_document_id: documentId, // Changed from kyc_document_id
          filepath: fileData.path,
          created_at: new Date().toISOString(),
        };

        const { data: uploadResult, error } = await supabase
          .from("acc_portal_licence_uploads")
          .insert(uploadData)
          .select()
          .single();

        if (error) throw error;

        if (extractOnUpload) {
          setSelectedExtractDocument(
            Object.values(documents)
              .flat()
              .find((d) => d.id === documentId)
          );
          setSelectedExtractUpload(uploadResult);
          setShowExtractModal(true);
          return uploadResult;
        }

        return uploadResult;
      } catch (error) {
        console.error("Upload error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["uploads"]);
      if (!data.extracted_details) {
        setShowUploadModal(false);
        toast.success("Document uploaded successfully");
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload document"
      );
      console.error("Upload error:", error);
    },
  });
  // Extract Details Mutation
  const extractionMutation = useMutation({
    mutationFn: async ({ uploadId, documentId, extractedData }) => {
      const { data, error } = await supabase
        .from("acc_portal_licence_uploads")
        .update({ extracted_details: extractedData })
        .eq("id", uploadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries(["uploads"]),
        queryClient.invalidateQueries(["documents"]),
      ]);
      setShowExtractModal(false);
      toast.success("Details extracted successfully");
    },

    onError: (error) => {
      toast.error("Failed to save extracted details");
      console.error("Extraction error:", error);
    },
  });
  // Utility Functions
  const isImageFile = (filepath: string): boolean => {
    if (!filepath) return false;
    const extension = filepath.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png"].includes(extension || "");
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getFilteredAndSortedCompanies = () => {
    let filtered = companies.filter((company) =>
      company.company_name.toLowerCase().includes(companySearch.toLowerCase())
    );

    if (sortColumn === "#") {
      filtered = [...filtered].sort((a, b) => {
        const aIndex = companies.indexOf(a);
        const bIndex = companies.indexOf(b);
        return sortDirection === "asc" ? aIndex - bIndex : bIndex - aIndex;
      });
    } else if (sortColumn === "Company") {
      filtered = [...filtered].sort((a, b) => {
        const comparison = a.company_name.localeCompare(b.company_name);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  };

  // Event Handlers
  const handleViewDocument = async (document, company) => {
    const upload = uploads.find(
      (u) =>
        u.licence_document_id === document.id && // Update to use licence_document_id
        u.userid === company.id.toString()
    );

    if (!upload) {
      toast.error("No document found");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("licence_documents")
        .createSignedUrl(upload.filepath, 60);

      if (error) throw error;

      setViewUrl(data.signedUrl);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error viewing image:", error);
      toast.error("Failed to view image");
    }
  };

  const handleUploadClick = (companyId: number, documentId: string) => {
    setSelectedUploadCompany(companies.find((c) => c.id === companyId) || null);
    setShowUploadModal(true);
  };

  const handleExtractClick = (document: Document, upload: Upload) => {
    setSelectedExtractDocument(document);
    setSelectedExtractUpload(upload);
    setShowExtractModal(true);
  };

  const handleExtractComplete = async (extractedData: any) => {
    try {
      if (!selectedExtractDocument || !selectedExtractUpload) return;

      await extractionMutation.mutateAsync({
        uploadId: selectedExtractUpload.id,
        documentId: selectedExtractDocument.id,
        extractedData,
      });

      setShowUploadModal(false);
      setShowExtractModal(false);
    } catch (error) {
      console.error("Error saving extracted data:", error);
      toast.error("Failed to save extracted data");
    }
  };

  const handleCancelExtraction = () => {
    setShowExtractModal(false);
    if (uploadMutation.isSuccess && selectedExtractUpload) {
      supabase.storage
        .from("licence_documents")
        .remove([selectedExtractUpload.filepath])
        .then(() => {
          supabase
            .from("acc_portal_licence_uploads")
            .delete()
            .eq("id", selectedExtractUpload.id)
            .then(() => {
              queryClient.invalidateQueries(["uploads"]);
              toast.success("Upload cancelled");
            });
        });
    }
  };

  const getCompanyVersions = (company) => {
    const companyUploads = uploads.filter(
      (u) =>
        u.licence_document_id === selectedDocument?.id && // Update to use licence_document_id
        u.userid === company.id.toString() &&
        isImageFile(u.filepath)
    );

    const isExpanded = expandedCompanies.has(company.id);
    if (companyUploads.length <= 1) return companyUploads;

    return showAllVersions || isExpanded ? companyUploads : [companyUploads[0]];
  };

  const exportToExcel = () => {
    if (!selectedDocument || !companies.length) return;

    try {
      // Create headers for the CSV
      const headers = ["#", "Company"];
      if (selectedDocument.fields) {
        headers.push(...selectedDocument.fields.map((f) => f.name));
      }

      // Get filtered and sorted companies
      const filteredCompanies = getFilteredAndSortedCompanies();

      // Create rows for the CSV
      let rows: string[][] = [];

      filteredCompanies.forEach((company, index) => {
        // Get all uploads for this company
        const companyUploads = uploads.filter(
          (u) =>
            u.kyc_document_id === selectedDocument?.id &&
            u.userid === company.id.toString() &&
            isImageFile(u.filepath) // Only include image files
        );

        // If company has no uploads, create a row with empty values
        if (companyUploads.length === 0) {
          rows.push([
            (index + 1).toString(),
            company.company_name,
            ...Array(selectedDocument.fields?.length || 0).fill("-"),
          ]);
        } else {
          // Create rows for each upload
          companyUploads.forEach((upload, uploadIndex) => {
            const row = [
              (index + 1).toString(),
              `${company.company_name}${
                companyUploads.length > 1 ? ` (v${uploadIndex + 1})` : ""
              }`,
            ];

            // Add fields
            if (selectedDocument.fields) {
              selectedDocument.fields.forEach((field) => {
                let value = upload.extracted_details?.[field.name];
                if (Array.isArray(value)) {
                  // Handle array values - convert to string representation
                  value = JSON.stringify(value);
                }
                row.push(value?.toString() || "-");
              });
            }

            rows.push(row);
          });
        }
      });

      // Convert to CSV format
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => {
              if (cell === null || cell === undefined) return '""';
              const cellStr = cell.toString().replace(/"/g, '""'); // Escape quotes
              return /[,"\n]/.test(cellStr) ? `"${cellStr}"` : cellStr;
            })
            .join(",")
        ),
      ].join("\n");

      // Create and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${selectedDocument.name}_export_${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Export completed successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  // Render Field Value Helper
  const renderFieldValue = (field: any, value: any) => {
    // If value is array
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
                  value.map((item, index) => (
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

    // For simple values
    return (
      <div className="text-[9px] min-w-[150px] max-w-[200px] px-2">
        <div className="line-clamp-2 text-left break-words">
          {value ? String(value) : "-"}
        </div>
      </div>
    );
  };

  // Document Item Component
  const DocumentItem = ({
    document,
    isSelected,
    onSelect,
    onAddField,
    onUpdateFields,
  }) => (
    <li
      className={`px-2 py-1 rounded flex items-center justify-between text-xs ${
        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-gray-100"
      }`}
    >
      <span className="cursor-pointer flex-1" onClick={onSelect}>
        {document.name}
      </span>
      <DocumentActions
        document={{
          ...document,
          fields: document.fields || [], // Add default empty array
        }}
        onAddField={onAddField}
        onUpdateFields={(documentId, fields) => {
          onUpdateFields({ documentId, fields });
        }}
      />
    </li>
  );
  // Render Sidebar
  const renderSidebar = () => (
    <div className="w-1/6 min-w-[180px] border-r overflow-hidden flex flex-col bg-gray-50 shadow-sm">
      <div className="p-3 border-b bg-white">
        <h2 className="text-sm font-semibold mb-2 text-gray-800">Documents</h2>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-1 h-7 text-xs pl-8 rounded-md border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-[7px] text-gray-400" />
        </div>
      </div>

      <div
        ref={parentRef}
        className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        {isLoadingDocuments ? (
          <div className="p-3 text-xs text-gray-500 flex items-center justify-center">
            Loading documents...
          </div>
        ) : (
          <ul className="space-y-0.5 p-2">
            {documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                document={doc}
                isSelected={selectedDocument?.id === doc.id}
                onSelect={() => setSelectedDocument(doc)}
                onAddField={() => {
                  setSelectedDocument(doc);
                  setIsAddFieldOpen(true);
                }}
                onUpdateFields={updateFieldsMutation.mutate}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
  // Main Component Return
  return (
    <div className="flex overflow-hidden">
      <Toaster position="top-right" />

      {renderSidebar()}

      <div className="flex-1 flex flex-col h-[800px] overflow-hidden">
        {selectedDocument ? (
          <div className="flex flex-col h-full">
            <div className="p-2 border-b space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">
                  {selectedDocument.name} - Details
                  <span className="ml-2 text-xs font-normal text-gray-500 capitalize">
                    {selectedDocument.category
                      ? `(${selectedDocument.category.replace(
                          "-docs",
                          " Documents"
                        )})`
                      : ""}
                  </span>
                </h2>

                {/* Statistics */}
                <div className="flex gap-3">
                  <div className="flex items-center text-xs">
                    <div className="bg-blue-50 px-2 py-1 rounded">
                      <span className="text-blue-600 font-medium">
                        Total Companies:{" "}
                      </span>
                      <span className="text-blue-700 font-bold">
                        {companies.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="bg-green-50 px-2 py-1 rounded">
                      <span className="text-green-600 font-medium">
                        Total companies with Documents:{" "}
                      </span>
                      <span className="text-green-700 font-bold">
                        {
                          uploads.filter(
                            (u) => u.licence_document_id === selectedDocument.id // Update to use licence_document_id
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="bg-orange-50 px-2 py-1 rounded">
                      <span className="text-orange-600 font-medium">
                        Companies Without Documents:{" "}
                      </span>
                      <span className="text-orange-700 font-bold">
                        {
                          companies.filter(
                            (company) =>
                              !uploads.some(
                                (u) =>
                                  u.kyc_document_id === selectedDocument.id &&
                                  u.userid === company.id.toString()
                              )
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search, Version Settings and Export controls */}
              <div className="flex justify-between items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Input
                    type="text"
                    placeholder="Search companies..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                  <Search className="h-4 w-4 absolute left-2 top-2 text-gray-400" />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      queryClient.invalidateQueries(["companies"]);
                      queryClient.invalidateQueries(["documents"]);
                      queryClient.invalidateQueries(["uploads"]);
                      toast.success("Data refreshed");
                    }}
                    className="flex items-center gap-2 h-8 text-xs"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  <VersionSettings
                    showAllVersions={showAllVersions}
                    onToggleAllVersions={toggleAllVersions}
                  />
                  <Button
                    variant="outline"
                    onClick={exportToExcel}
                    className="flex items-center gap-2 h-8 text-xs"
                  >
                    <Download className="h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-auto flex-1">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow className="text-[10px] bg-blue-100 border-b-2 border-blue-200">
                      <TableHead
                        className="sticky top-0 left-0 bg-blue-100 z-10 cursor-pointer border-r border-gray-400 w-12"
                        onClick={() => handleSort("#")}
                      >
                        <div className="flex items-center">
                          ⇅#
                          {sortColumn === "#" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-1" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className="sticky top-0 left-0 bg-blue-100 z-10 cursor-pointer border-r border-gray-400 min-w-[200px]"
                        onClick={() => handleSort("Company")}
                      >
                        <div className="flex items-center">
                          ⇅ Company
                          {sortColumn === "Company" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4 ml-1" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-1" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-blue-100 z-10 border-r border-gray-400 w-28">
                        Actions
                      </TableHead>
                      {selectedDocument.fields?.map((field) => (
                        <TableHead
                          key={field.id}
                          className="text-center sticky top-0 bg-blue-100 z-10 border-r border-gray-400 last:border-r-0 min-w-[150px] max-w-[200px] px-2"
                        >
                          <div className="truncate" title={field.name}>
                            {field.name}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody className="text-[11px]">
                    {getFilteredAndSortedCompanies().map(
                      (company, companyIndex) => {
                        const companyUploads = uploads.filter(
                          (u) =>
                            u.kyc_document_id === selectedDocument?.id &&
                            u.userid === company.id.toString()
                        );

                        // If company has no uploads, render empty row
                        if (companyUploads.length === 0) {
                          return (
                            <TableRow
                              key={company.id}
                              className="border-b-2 border-blue-200 hover:bg-gray-50"
                            >
                              <TableCell className="font-medium sticky left-0 bg-white border-r border-gray-300 w-12">
                                {companyIndex + 1}
                              </TableCell>
                              <TableCell className="font-medium sticky left-0 bg-white border-r border-gray-300 min-w-[200px]">
                                <div className="text-[10px] line-clamp-2 break-words">
                                  {company.company_name}
                                </div>
                              </TableCell>
                              <TableCell className="text-center border-r border-gray-300 w-28">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleUploadClick(
                                      company.id,
                                      selectedDocument.id
                                    )
                                  }
                                  title="Upload Document"
                                  className="h-7 w-7"
                                >
                                  <UploadIcon className="h-3 w-3 text-orange-500" />
                                </Button>
                              </TableCell>
                              {selectedDocument.fields?.map((field) => (
                                <TableCell
                                  key={field.id}
                                  className="text-center border-r border-gray-300 min-w-[150px] max-w-[200px]"
                                >
                                  -
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        }

                        // For companies with uploads, handle version display
                        const isExpanded = expandedCompanies.has(company.id);
                        const visibleUploads =
                          showAllVersions || isExpanded
                            ? companyUploads
                            : [companyUploads[0]];

                        return visibleUploads.map((upload, versionIndex) => (
                          <TableRow
                            key={`${company.id}-${upload.id}`}
                            className={`
          ${
            versionIndex === visibleUploads.length - 1
              ? "border-b-2 border-blue-200"
              : "border-b border-gray-300"
          }
          hover:bg-gray-50
        `}
                          >
                            {versionIndex === 0 && (
                              <>
                                <TableCell
                                  className="font-medium sticky left-0 bg-white border-r border-gray-300 w-12"
                                  rowSpan={visibleUploads.length}
                                >
                                  <div className="flex items-center gap-1">
                                    {companyIndex + 1}
                                    {companyUploads.length > 1 && (
                                      
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
                                  </div>
                                </TableCell>
                                <TableCell
                                  className="font-medium sticky left-0 bg-white border-r border-gray-300 min-w-[200px]"
                                  rowSpan={visibleUploads.length}
                                >
                                  <div className="text-[10px] line-clamp-2 break-words">
                                    {company.company_name}
                                  </div>
                                </TableCell>
                              </>
                            )}
                            <TableCell className="text-center border-r border-gray-300 w-28">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-[9px] text-green-300">
                                  {versionIndex === 0
                                    ? "Latest"
                                    : `v${
                                        companyUploads.length - versionIndex
                                      }`}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleViewDocument(
                                        selectedDocument,
                                        company
                                      )
                                    }
                                    title="View Document"
                                    className="h-7 w-7"
                                  >
                                    <Eye className="h-3 w-3 text-blue-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleExtractClick(
                                        selectedDocument,
                                        upload
                                      )
                                    }
                                    title="Extract Details"
                                    className="h-7 w-7"
                                  >
                                    <DownloadIcon className="h-3 w-3 text-green-500" />
                                  </Button>
                                  {versionIndex === 0 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleUploadClick(
                                          company.id,
                                          selectedDocument.id
                                        )
                                      }
                                      title="Upload New Version"
                                      className="h-7 w-7"
                                    >
                                      <UploadIcon className="h-3 w-3 text-orange-500" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            {selectedDocument.fields?.map((field) => (
                              <TableCell
                                key={field.id}
                                className="text-center border-r border-gray-300"
                              >
                                {renderFieldValue(
                                  field,
                                  upload?.extracted_details?.[field.name]
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ));
                      }
                    )}
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
      {showUploadModal && selectedUploadCompany && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={uploadMutation.mutate}
          company={selectedUploadCompany}
          document={selectedDocument}
        />
      )}

      {showViewModal && (
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
          onClose={handleCancelExtraction}
          document={selectedExtractDocument}
          upload={selectedExtractUpload}
          onSubmit={handleExtractComplete}
        />
      )}
    </div>
  );
}
