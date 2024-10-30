// app/page.tsx
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import OnboardingPage from "./onboarding";
import { Button } from "@/components/ui/button";
import Upload from "./upload";

export default function Page() {
  const [step, setStep] = useState(1);
  const [companyData, setCompanyData] = useState<any>({
    company_name: "",
    username: "",
    password: "",
    uploadedData: null,
  });
  useEffect(() => {
    console.log('Current step:', step);
  }, [step]);
  const handleOnboardingComplete = (data: any) => {
    console.log('Onboarding complete, data:', data);
    setCompanyData({ 
      ...companyData, 
      company_name: data.name,
      username: data.username,
      password: data.password
    });
    console.log('Moving to step 2');
    setStep(2);
  };

  const handleUploadComplete = (data: any) => {
    setCompanyData({ 
      ...companyData, 
      uploadedData: data.uploadedData 
    });
    setStep(3);
  };
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="w-full max-w-4xl">
          <div className="mb-8">
            <div className="relative flex justify-between items-center">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex flex-col items-center z-10">
                  <div className={`rounded-full h-16 w-16 flex items-center justify-center border-2 transition-all duration-300 ${
                    step >= item ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-300'
                  }`}>
                    {item === 1 && (
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                    {item === 2 && (
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                    {item === 3 && (
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <span className={`mt-4 font-medium transition-all duration-300 ${
                    step >= item ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {item === 1 && "Onboard Company"}
                    {item === 2 && "Upload Details"}
                    {item === 3 && "Completed"}
                  </span>
                </div>
              ))}
              <div className="absolute top-8 left-0 w-full h-0.5">
                <div className="w-full h-full bg-gray-200">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg">
            {step === 1 && (
              <OnboardingPage onComplete={handleOnboardingComplete} />
            )}
            {step === 2 && (
              <Upload onComplete={handleUploadComplete} />
            )}
            {step === 3 && (
              <div className="text-center space-y-6">
                <div className="text-green-600">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h2 className="text-2xl font-bold mt-4">
                    Setup Completed Successfully!
                  </h2>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg text-left">
                  <h3 className="text-lg font-semibold mb-4">Company Details</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Company Name:</span> {companyData.company_name}</p>
                    <p><span className="font-medium">Username:</span> {companyData.username}</p>
                    <p><span className="font-medium">Password:</span> {companyData.password}</p>
                    <p><span className="font-medium">Uploaded Records:</span> {companyData.uploadedData?.length || 0}</p>
                  </div>
                </div>

                <Button
                  onClick={() => window.location.href = '/sign-in'}
                  className="mt-4"
                >
                  Go to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }