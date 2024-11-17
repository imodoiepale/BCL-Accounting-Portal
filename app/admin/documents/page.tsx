import React from 'react';
import { Settings, Download, Plus, X } from 'lucide-react';

interface Document {
  uploaded: boolean;
  issueDate: string;
  expiryDate: string;
  daysLeft: number;
}

interface CompanyDocuments {
  pin: Document;
  certificate: Document;
  profile: Document;
  tax: Document;
  manufacturer: Document;
}

interface Company {
  id: number;
  name: string;
  documents: CompanyDocuments;
}

interface DocumentType {
  title: string;
  key: keyof CompanyDocuments;
}

const DocumentManagement = () => {
  const documentTypes: DocumentType[] = [
    {
      title: "Company PIN Checker - PIN Details - Recent Download",
      key: "pin"
    },
    {
      title: "Company - KRA Pin Certificate - Recent Download",
      key: "certificate"
    },
    {
      title: "Company KRA Profile - Recent Download",
      key: "profile"
    },
    {
      title: "Company - Tax Compliance Certificate - Recent Download",
      key: "tax"
    },
    {
      title: "Company Manufacturer Authorization - Recent Download",
      key: "manufacturer"
    }
  ];

  const sampleCompanies: Company[] = [
    {
      id: 1,
      name: "Tech Solutions Ltd",
      documents: {
        pin: { uploaded: true, issueDate: "2024-01-15", expiryDate: "2025-01-15", daysLeft: 260 },
        certificate: { uploaded: true, issueDate: "2024-02-01", expiryDate: "2025-02-01", daysLeft: 277 },
        profile: { uploaded: false, issueDate: "", expiryDate: "", daysLeft: 0 },
        tax: { uploaded: true, issueDate: "2024-03-10", expiryDate: "2025-03-10", daysLeft: 314 },
        manufacturer: { uploaded: false, issueDate: "", expiryDate: "", daysLeft: 0 }
      }
    },
    {
      id: 2,
      name: "Global Traders Inc",
      documents: {
        pin: { uploaded: true, issueDate: "2024-02-20", expiryDate: "2025-02-20", daysLeft: 296 },
        certificate: { uploaded: false, issueDate: "", expiryDate: "", daysLeft: 0 },
        profile: { uploaded: true, issueDate: "2024-01-05", expiryDate: "2025-01-05", daysLeft: 250 },
        tax: { uploaded: false, issueDate: "", expiryDate: "", daysLeft: 0 },
        manufacturer: { uploaded: true, issueDate: "2024-03-01", expiryDate: "2025-03-01", daysLeft: 305 }
      }
    }
  ];

  const getDocumentStatus = (doc: Document): string => {
    if (!doc.uploaded) return "";
    const daysLeft = doc.daysLeft;
    if (daysLeft > 90) return "bg-green-100 px-2 py-1 rounded";
    if (daysLeft > 30) return "bg-yellow-100 px-2 py-1 rounded";
    return "bg-red-100 px-2 py-1 rounded";
  };

  return (
    <div className="w-full p-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Document Management - KRA</h1>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search companies..."
              className="px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button 
            className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            title="Export to Excel"
          >
            <Download className="w-4 h-4 inline mr-2" />
            Export to Excel
          </button>

          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-300">
              <th className="border-r-2 border-gray-300 p-3 text-left" rowSpan={2}>#</th>
              <th className="border-r-2 border-gray-300 p-3 text-left" rowSpan={2}>Company</th>
              <th className="border-r-2 border-gray-300 p-3 text-center" colSpan={5}>
                <div className="font-bold mb-2">Upload Status</div>
                <div className="flex flex-col gap-1">
                  <div className="bg-green-100 p-2 rounded font-bold">Complete: 6</div>
                  <div className="bg-red-100 p-2 rounded font-bold">Pending: 4</div>
                  <div className="bg-gray-100 p-2 rounded font-bold">Total: 10</div>
                </div>
              </th>
            </tr>
            <tr className="bg-gray-50 border-b-2 border-gray-300">
              <th className="border-r-2 border-gray-300 p-3 text-center">Upload</th>
              <th className="border-r-2 border-gray-300 p-3 text-center">Issue Date</th>
              <th className="border-r-2 border-gray-300 p-3 text-center">Expiry Date</th>
              <th className="border-r-2 border-gray-300 p-3 text-center">Days Left</th>
              <th className="border-r-2 border-gray-300 p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {sampleCompanies.map((company) => (
              <tr key={company.id} className="border-b-2 border-gray-300 hover:bg-gray-50">
                <td className="border-r-2 border-gray-300 p-3">{company.id}</td>
                <td className="border-r-2 border-gray-300 p-3 font-medium">{company.name}</td>
                {documentTypes.map((type) => (
                  <>
                    <td className="border-r-2 border-gray-300 p-3 text-center">
                      {company.documents[type.key].uploaded ? 
                        <span className="text-green-600">✓</span> : 
                        <span className="text-red-600">✗</span>
                      }
                    </td>
                    <td className="border-r-2 border-gray-300 p-3">{company.documents[type.key].issueDate}</td>
                    <td className="border-r-2 border-gray-300 p-3">{company.documents[type.key].expiryDate}</td>
                    <td className="border-r-2 border-gray-300 p-3">
                      <span className={getDocumentStatus(company.documents[type.key])}>
                        {company.documents[type.key].daysLeft || "-"}
                      </span>
                    </td>
                    <td className="border-r-2 border-gray-300 p-3">
                      <div className="flex justify-center gap-2">
                        <button 
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                          title="Add document"
                        >
                          <Plus className="w-4 h-4 text-blue-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Remove document"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentManagement;