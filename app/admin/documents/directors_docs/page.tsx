"use client"
import React, { useState } from 'react';
import DocumentManagement from './document-management';
import DirectorsKycDocumentDetails from './directors-kyc-document-details';

const Page = () => {
  const [activeTab, setActiveTab] = useState('KYC Docs');

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 max-w-full mx-auto">
        <h1 className="text-xl font-semibold mb-3 text-gray-800">Directors KYC Management</h1>
        
        <div className="flex space-x-3 mb-3">
          {['KYC Docs', 'KYC Document Details'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${
                activeTab === tab 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg h-[calc(100vh-130px)]">
          {activeTab === 'KYC Docs' && (
            <div className="h-full">
              <DocumentManagement />
            </div>
          )}
          {activeTab === 'KYC Document Details' && (
            <div className="h-full">
              <DirectorsKycDocumentDetails />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;