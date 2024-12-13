"use client";
import React, { useState } from 'react';
import DocumentManagement from './document-management';
import CompanyKycDocumentDetails from './company-kyc-document-details';
import DocumentList from './DocumentList';

const Page = () => {
  const [activeTab, setActiveTab] = useState('KYC Docs');

  const tabs = [
    { key: 'KYC Docs', label: 'Company KYC Documents', component: <DocumentManagement /> },
    { key: 'KYC Document Details', label: 'Document Extracted Details', component: <CompanyKycDocumentDetails /> },
    { key: 'Document List', label: 'Company View', component: <DocumentList /> },
  ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">Company KYC Management</h1>
      {/* Compact Tabs Navigation */}
      <div className="flex items-center space-x-1 mb-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-sm px-2 py-1 -mb-px border-b-2 ${
              activeTab === tab.key 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
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