"use client";
import React, { useState } from 'react';
import DocumentManagement from './document-management';
import CompanyKycDocumentDetails from './company-kyc-document-details';
import DocumentList from './DocumentList';

const Page = () => {
  const [activeTab, setActiveTab] = useState('KYC Docs');

  const tabs = [
    { key: 'KYC Docs', label: 'KYC Documents', component: <DocumentManagement /> },
    { key: 'KYC Document Details', label: 'KYC Extracted Document Details', component: <CompanyKycDocumentDetails /> },
    { key: 'Document List', label: 'KYC Document Company View', component: <DocumentList /> },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Company KYC Management</h1>
      {/* Tabs Navigation */}
      <div className="flex space-x-4 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Render Active Tab */}
      <div>
        {tabs.find(tab => tab.key === activeTab)?.component}
      </div>
    </div>
  );
};

export default Page;
