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
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center">
                <div className={`rounded-full h-12 w-12 flex items-center justify-center ${
                  step >= item ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  {item}
                </div>
                {item < 3 && (
                  <div className={`h-1 w-24 ${
                    step > item ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span>Onboard Company</span>
            <span>Upload Details</span>
            <span>Completed</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg">
          {step === 1 && (
            <OnboardingPage onComplete={handleOnboardingComplete} />
          )}
          {step === 2 && (
            <Upload onComplete={handleUploadComplete} companyData={companyData} />
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