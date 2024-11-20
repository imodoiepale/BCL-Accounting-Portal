
// Sample data for Company KYC Document Details
// company-kyc-document-details.tsx
import React from 'react';

const CompanyKycDocumentDetails = () => {
  const sampleData = [
    { id: 1, name: 'Document A', status: 'Valid', expiryDate: '2025-12-31' },
    { id: 2, name: 'Document B', status: 'Expired', expiryDate: '2023-10-15' },
    { id: 3, name: 'Document C', status: 'Expiring Soon', expiryDate: '2024-01-05' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Company KYC Document Details</h2>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">ID</th>
            <th className="border border-gray-300 p-2">Name</th>
            <th className="border border-gray-300 p-2">Status</th>
            <th className="border border-gray-300 p-2">Expiry Date</th>
          </tr>
        </thead>
        <tbody>
          {sampleData.map(doc => (
            <tr key={doc.id}>
              <td className="border border-gray-300 p-2">{doc.id}</td>
              <td className="border border-gray-300 p-2">{doc.name}</td>
              <td className="border border-gray-300 p-2">{doc.status}</td>
              <td className="border border-gray-300 p-2">{doc.expiryDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompanyKycDocumentDetails;