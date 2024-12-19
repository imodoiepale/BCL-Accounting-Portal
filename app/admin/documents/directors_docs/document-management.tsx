"use client";

import React, { useState, useEffect } from "react";
import { FileDown, X, ChevronUp, ChevronDown } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { format, differenceInDays, isValid } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import DocumentActions from "./DocumentActions";
import UploadModal from "./UploadModal";
import ViewModal from "./ViewModal";

// Types
interface Company {
  id: number;
  company_name: string;
}

interface Director {
  id: number;
  company_id: number;
  full_name: string;
}

interface Document {
  id: string;
  name: string;
  category: string;
}

interface DirectorDocument {
  id: number;
  company_id: number;
  director_id: number;
  document_id: string;
  issue_date: string;
  expiry_date: string;
  file_path: string;
  status: "pending" | "complete" | "missing";
  version?: number;
}

type SortField = "company" | "issueDate" | "expiryDate" | "daysLeft" | "status";
type SortDirection = "asc" | "desc";

interface VisibleColumnSettings {
  visible: boolean;
  subColumns: {
    upload: boolean;
    issueDate: boolean;
    expiryDate: boolean;
    daysLeft: boolean;
    status: boolean;
  };
}

interface VisibleColumns {
  [key: string]: VisibleColumnSettings;
}

interface Stats {
  total: number;
  missing: number;
  complete: number;
}

const DocumentManagement: React.FC = () => {
  // State Management
  const [companies, setCompanies] = useState<Company[]>([]);
  const [directors, setDirectors] = useState<{ [key: number]: Director[] }>({});
  const [documents, setDocuments] = useState<Document[]>([]);
  const [directorDocuments, setDirectorDocuments] = useState<
    DirectorDocument[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(
    null
  );
  const [selectedViewData, setSelectedViewData] = useState<{
    companyName: string;
    directorName: string;
    documentName: string;
    companyId: number;
    directorId: number;
    documentId: string;
  } | null>(null);
  const [sortField, setSortField] = useState<SortField>("company");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({});

  // Data Fetching
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchCompanies(),
        fetchDirectors(),
        fetchDocuments(),
        fetchDirectorDocuments(),
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('acc_portal_company_duplicate')
        .select('*')
        .order('company_name');
  
      if (error) {
        throw error;
      }
  
      if (data) {
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to fetch companies');
    }
  };
  
  const fetchDirectors = async () => {
    try {
      const { data, error } = await supabase
        .from('acc_portal_directors_duplicate')
        .select(`
          id,
          company_id,
          full_name
        `)
        .order('full_name');
  
      if (error) {
        throw error;
      }
  
      if (data) {
        // Group directors by company_id
        const directorsByCompany = data.reduce((acc, director) => {
          if (!acc[director.company_id]) {
            acc[director.company_id] = [];
          }
          acc[director.company_id].push(director);
          return acc;
        }, {} as { [key: number]: Director[] });
  
        setDirectors(directorsByCompany);
      }
    } catch (error) {
      console.error('Error fetching directors:', error);
      toast.error('Failed to fetch directors');
    }
  };
  
  // Add this useEffect to handle initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchCompanies(),
          fetchDirectors(),
          fetchDocuments(),
          fetchDirectorDocuments(),
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load some data');
      } finally {
        setIsLoading(false);
      }
    };
  
    loadInitialData();
  }, []); // Empty dependency array for initial load only

  const fetchDocuments = async () => {
    const { data: documentsData, error: documentsError } = await supabase
      .from("acc_portal_kyc")
      .select("*")
      .eq("category", "directors-docs");

    if (documentsError) throw documentsError;

    const initialVisibility = documentsData.reduce((acc, doc) => {
      acc[doc.id] = {
        visible: true,
        subColumns: {
          upload: true,
          issueDate: true,
          expiryDate: true,
          daysLeft: true,
          status: true,
        },
      };
      return acc;
    }, {});

    setDocuments(documentsData);
    setVisibleColumns(initialVisibility);
  };

  const fetchDirectorDocuments = async () => {
    const { data: directorDocsData, error: directorDocsError } = await supabase
      .from("acc_portal_directors_documents")
      .select("*");

    if (directorDocsError) throw directorDocsError;
    setDirectorDocuments(directorDocsData);
  };
  // Utility Functions
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return isValid(date) ? format(date, "MM/dd/yyyy") : "-";
  };

  const calculateDaysLeft = (
    expiryDateString: string | null | undefined
  ): string | number => {
    if (!expiryDateString) return "-";
    const expiryDate = new Date(expiryDateString);
    if (!isValid(expiryDate)) return "-";
    return differenceInDays(expiryDate, new Date());
  };

  const getDocumentCount = (
    companyId: number,
    directorId: number,
    documentId: string
  ): number => {
    return directorDocuments.filter(
      (doc) =>
        doc.company_id === companyId &&
        doc.director_id === directorId &&
        doc.document_id === documentId
    ).length;
  };

  const calculateStats = (documentId?: string): Stats => {
    const stats: Stats = {
      total: 0,
      missing: 0,
      complete: 0,
    };

    getSortedCompanies().forEach((company) => {
      const companyDirectors = directors[company.id] || [];

      if (documentId) {
        stats.total += companyDirectors.length;
        companyDirectors.forEach((director) => {
          const status = getDocumentStatus(company.id, director.id, documentId);
          if (status === "complete") {
            stats.complete += 1;
          } else {
            stats.missing += 1;
          }
        });
      } else {
        stats.total += companyDirectors.length * documents.length;
        documents.forEach((doc) => {
          companyDirectors.forEach((director) => {
            const status = getDocumentStatus(company.id, director.id, doc.id);
            if (status === "complete") {
              stats.complete += 1;
            } else {
              stats.missing += 1;
            }
          });
        });
      }
    });

    return stats;
  };

  const getSortedCompanies = () => {
    let filteredCompanies = [...companies];

    if (searchTerm) {
      filteredCompanies = filteredCompanies.filter((company) =>
        company.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredCompanies.sort((a, b) => {
      const modifier = sortDirection === "asc" ? 1 : -1;

      switch (sortField) {
        case "company":
          return modifier * a.company_name.localeCompare(b.company_name);
        default:
          return 0;
      }
    });
  };

  const getDocumentStatus = (
    companyId: number,
    directorId: number,
    documentId: string
  ) => {
    const doc = directorDocuments.find(
      (d) =>
        d.company_id === companyId &&
        d.director_id === directorId &&
        d.document_id === documentId
    );

    return doc?.status || "missing";
  };
  // Rendering Functions
  const renderDocumentDetails = (
    companyId: number,
    directorId: number,
    documentId: string
  ) => {
    const documentsCount = getDocumentCount(companyId, directorId, documentId);
    const documentRecord = directorDocuments.find(
      (doc) =>
        doc.company_id === companyId &&
        doc.director_id === directorId &&
        doc.document_id === documentId
    );

    const status = documentRecord?.status || "missing";
    const daysLeft = documentRecord
      ? calculateDaysLeft(documentRecord.expiry_date)
      : "-";

    const handleView = () => {
      const company = companies.find((c) => c.id === companyId);
      const director = directors[companyId]?.find((d) => d.id === directorId);
      const document = documents.find((d) => d.id === documentId);

      if (company && director && document) {
        setSelectedViewData({
          companyName: company.company_name,
          directorName: director.full_name,
          documentName: document.name,
          companyId,
          directorId,
          documentId,
        });
        setShowViewModal(true);
      }
    };

    const handleAdd = () => {
      setSelectedCompany(companies.find((c) => c.id === companyId) || null);
      setSelectedDirector(
        directors[companyId]?.find((d) => d.id === directorId) || null
      );
      setSelectedDocument(documents.find((d) => d.id === documentId) || null);
      setShowUploadModal(true);
    };

    return (
      <>
        <td className="p-2 border border-gray-300 text-center">
          {documentsCount > 0 ? (
            <DocumentActions
              documentsCount={documentsCount}
              onView={handleView}
              onAdd={handleAdd}
            />
          ) : (
            <button
              onClick={handleAdd}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
            >
              Upload
            </button>
          )}
        </td>
        <td className="p-2 border border-gray-300 text-center text-xs text-gray-600">
          {formatDate(documentRecord?.issue_date)}
        </td>
        <td className="p-2 border border-gray-300 text-center text-xs text-gray-600">
          {formatDate(documentRecord?.expiry_date)}
        </td>
        <td className="p-2 border border-gray-300 text-center text-xs">
          {daysLeft}
        </td>
        <td className="p-2 border border-gray-300 text-center">
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${
              status === "complete"
                ? "bg-green-100 text-green-700"
                : status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </td>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  return (
    <div className="w-full h-screen p-4 bg-white flex flex-col">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-200 text-gray-700 text-sm">
            <FileDown className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-200 text-gray-700 text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm border-collapse min-w-[1500px]">
            {/* Table Header */}
            <thead className="sticky top-0 bg-white z-10">
              <tr className="bg-gray-100 text-xs">
                <th
                  className="p-2 border border-gray-300 font-semibold text-gray-700"
                  rowSpan={2}
                >
                  No.
                </th>
                <th
                  className="p-2 border border-gray-300 font-semibold text-gray-700"
                  rowSpan={2}
                >
                  Companies
                </th>
                <th
                  className="p-2 border border-gray-300 font-semibold text-gray-700"
                  rowSpan={2}
                >
                  Directors
                </th>
                <th
                  className="p-2 border border-gray-300 font-semibold text-gray-700"
                  rowSpan={2}
                >
                  Summary
                </th>
                {documents.map(
                  (doc) =>
                    visibleColumns[doc.id]?.visible && (
                      <th
                        key={doc.id}
                        className="p-2 border border-gray-300 font-semibold text-gray-700 text-center bg-blue-50"
                        colSpan={5}
                      >
                        {doc.name}
                      </th>
                    )
                )}
              </tr>
              <tr className="bg-gray-50 text-xs">
                {documents.map(
                  (doc) =>
                    visibleColumns[doc.id]?.visible && (
                      <React.Fragment key={`header-${doc.id}`}>
                        <th className="p-2 border border-gray-300 font-medium text-gray-600">
                          Action
                        </th>
                        <th
                          className="p-2 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                          onClick={() => {
                            if (sortField === "issueDate") {
                              setSortDirection((prev) =>
                                prev === "asc" ? "desc" : "asc"
                              );
                            }
                            setSortField("issueDate");
                          }}
                        >
                          <div className="flex items-center justify-between">
                            Issue Date
                            {sortField === "issueDate" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              ))}
                          </div>
                        </th>
                        <th
                          className="p-2 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                          onClick={() => {
                            if (sortField === "expiryDate") {
                              setSortDirection((prev) =>
                                prev === "asc" ? "desc" : "asc"
                              );
                            }
                            setSortField("expiryDate");
                          }}
                        >
                          <div className="flex items-center justify-between">
                            Expiry Date
                            {sortField === "expiryDate" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              ))}
                          </div>
                        </th>
                        <th
                          className="p-2 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                          onClick={() => {
                            if (sortField === "daysLeft") {
                              setSortDirection((prev) =>
                                prev === "asc" ? "desc" : "asc"
                              );
                            }
                            setSortField("daysLeft");
                          }}
                        >
                          <div className="flex items-center justify-between">
                            Days Left
                            {sortField === "daysLeft" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              ))}
                          </div>
                        </th>
                        <th
                          className="p-2 border border-gray-300 font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
                          onClick={() => {
                            if (sortField === "status") {
                              setSortDirection((prev) =>
                                prev === "asc" ? "desc" : "asc"
                              );
                            }
                            setSortField("status");
                          }}
                        >
                          <div className="flex items-center justify-between">
                            Status
                            {sortField === "status" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              ))}
                          </div>
                        </th>
                      </React.Fragment>
                    )
                )}
              </tr>
            </thead>
            <tbody className="text-xs">
              {/* Stats rows */}
              <tr className="bg-gray-50">
                <td className="p-2 border border-gray-300" colSpan={2}></td>
                <td className="p-2 border border-gray-300" rowSpan={3}></td>
                <td className="p-2 border border-gray-300 font-semibold text-blue-600">
                  Total
                </td>
                {documents.map(
                  (doc) =>
                    visibleColumns[doc.id]?.visible && (
                      <React.Fragment key={`total-${doc.id}`}>
                        <td
                          className="p-2 border border-gray-300 text-center font-medium"
                          colSpan={5}
                        >
                          {calculateStats(doc.id).total}
                        </td>
                      </React.Fragment>
                    )
                )}
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 border border-gray-300" colSpan={2}></td>
                <td className="p-2 border border-gray-300 font-semibold text-orange-600">
                  Missing
                </td>
                {documents.map(
                  (doc) =>
                    visibleColumns[doc.id]?.visible && (
                      <React.Fragment key={`missing-${doc.id}`}>
                        <td
                          className="p-2 border border-gray-300 text-center font-medium"
                          colSpan={5}
                        >
                          {calculateStats(doc.id).missing}
                        </td>
                      </React.Fragment>
                    )
                )}
              </tr>
              <tr className="bg-gray-50">
                <td className="p-2 border border-gray-300" colSpan={2}></td>
                <td className="p-2 border border-gray-300 font-semibold text-green-600">
                  Completed
                </td>
                {documents.map(
                  (doc) =>
                    visibleColumns[doc.id]?.visible && (
                      <React.Fragment key={`complete-${doc.id}`}>
                        <td
                          className="p-2 border border-gray-300 text-center font-medium"
                          colSpan={5}
                        >
                          {calculateStats(doc.id).complete}
                        </td>
                      </React.Fragment>
                    )
                )}
              </tr>

              {/* Company and Director rows */}
              {getSortedCompanies().map((company, companyIndex) => {
                const companyDirectors = directors[company.id] || [];
                return companyDirectors.length > 0 ? (
                  // Map through directors if company has directors
                  companyDirectors.map((director, directorIndex) => (
                    <tr
                      key={`${company.id}-${director.id}`}
                      className={
                        companyIndex % 2 === 0
                          ? "bg-white hover:bg-gray-50"
                          : "bg-gray-50 hover:bg-gray-100"
                      }
                    >
                      {/* Company details - only show on first director row */}
                      {directorIndex === 0 && (
                        <>
                          <td
                            className="p-2 border border-gray-300 text-center"
                            rowSpan={companyDirectors.length}
                          >
                            {companyIndex + 1}
                          </td>
                          <td
                            className="p-2 border border-gray-300"
                            rowSpan={companyDirectors.length}
                          >
                            {company.company_name}
                          </td>
                        </>
                      )}

                      {/* Director name */}
                      <td className="p-2 border border-gray-300">
                        {director.full_name}
                      </td>

                      {/* Summary column */}
                      <td className="p-2 border border-gray-300 text-center">
                        {/* Add summary info if needed */}
                      </td>

                      {/* Document columns */}
                      {documents.map(
                        (doc) =>
                          visibleColumns[doc.id]?.visible && (
                            <React.Fragment
                              key={`${company.id}-${director.id}-${doc.id}`}
                            >
                              {renderDocumentDetails(
                                company.id,
                                director.id,
                                doc.id
                              )}
                            </React.Fragment>
                          )
                      )}
                    </tr>
                  ))
                ) : (
                  // Show company with no directors
                  <tr
                    key={`${company.id}-no-directors`}
                    className={
                      companyIndex % 2 === 0
                        ? "bg-white hover:bg-gray-50"
                        : "bg-gray-50 hover:bg-gray-100"
                    }
                  >
                    <td className="p-2 border border-gray-300 text-center">
                      {companyIndex + 1}
                    </td>
                    <td className="p-2 border border-gray-300">
                      {company.company_name}
                    </td>
                    <td className="p-2 border border-gray-300 text-gray-500 italic">
                      No directors
                    </td>
                    <td className="p-2 border border-gray-300">
                      {/* Empty summary */}
                    </td>
                    {documents.map(
                      (doc) =>
                        visibleColumns[doc.id]?.visible && (
                          <React.Fragment
                            key={`${company.id}-no-director-${doc.id}`}
                          >
                            <td
                              colSpan={5}
                              className="p-2 border border-gray-300 text-center text-gray-500 italic"
                            >
                              No director data
                            </td>
                          </React.Fragment>
                        )
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals Section */}
      {showUploadModal && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          selectedCompany={selectedCompany}
          selectedDirector={selectedDirector}
          selectedDocument={selectedDocument}
          onUploadComplete={fetchDirectorDocuments}
        />
      )}

      {showViewModal && selectedViewData && (
        <ViewModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          {...selectedViewData}
          onDelete={fetchDirectorDocuments}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-semibold mb-4">Column Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={visibleColumns[doc.id]?.visible}
                      onChange={() => {
                        setVisibleColumns((prev) => ({
                          ...prev,
                          [doc.id]: {
                            ...prev[doc.id],
                            visible: !prev[doc.id].visible,
                          },
                        }));
                      }}
                      className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      {doc.name}
                    </label>
                  </div>
                  {visibleColumns[doc.id]?.visible && (
                    <div className="space-y-2 ml-6">
                      {Object.entries(visibleColumns[doc.id].subColumns).map(
                        ([key, value]) => (
                          <div key={key} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={() => {
                                setVisibleColumns((prev) => ({
                                  ...prev,
                                  [doc.id]: {
                                    ...prev[doc.id],
                                    subColumns: {
                                      ...prev[doc.id].subColumns,
                                      [key]: !value,
                                    },
                                  },
                                }));
                              }}
                              className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
                            />
                            <label className="text-xs font-medium text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                            </label>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
};

export default DocumentManagement;
