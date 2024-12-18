"use client"
import React, { useState } from 'react';
import DocumentManagement from './document-management';
import DirectorsKycDocumentDetails from './directors-kyc-document-details';

const Page = () => {
  const [activeTab, setActiveTab] = useState('KYC Docs');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-full">
        <div className="flex border-b">
          {['KYC Docs', 'KYC Document Details'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium -mb-px ${
                activeTab === tab 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4">
          <h1 className="text-xl font-semibold mb-3 text-gray-800">Directors KYC Management</h1>
          
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
    </div>
  );
};

export default Page;