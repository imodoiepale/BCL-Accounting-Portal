
"use client"
import React, { useState } from 'react';
import DocumentManagement from './document-management';
import CompanyKycDocumentDetails from './company-kyc-document-details';

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