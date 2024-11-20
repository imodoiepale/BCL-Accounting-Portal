"use client"
import React, { useState } from 'react';
import DocumentManagement from './document-management';

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

const Page = () => {
  const [activeTab, setActiveTab] = useState('KYC Docs');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Company KYC Management</h1>
      <div className="flex space-x-4 mb-4">
        {['KYC Docs', 'KYC Document Details'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === 'KYC Docs' && <DocumentManagement />}
      {activeTab === 'KYC Document Details' && <CompanyKycDocumentDetails />}
    </div>
  );
};

export default Page;