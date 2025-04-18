// app/page.tsx
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import OnboardingPage from "./onboarding";
import { Button } from "@/components/ui/button";
import Upload from "./upload";
import { supabase } from "@/lib/supabaseClient";

export default function Page() {
  const [step, setStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedStep = localStorage.getItem('onboardingStep');
      return savedStep ? parseInt(savedStep) : 1;
    }
    return 1;
  });
  
  const [companyData, setCompanyData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('companyData');
      return savedData ? JSON.parse(savedData) : {
        company_name: "",
        username: "",
        password: "",
        uploadedData: null,
      };
    }
    return {
      company_name: "",
      username: "",
      password: "",
      uploadedData: null,
    };
  });

  useEffect(() => {
    localStorage.setItem('onboardingStep', step.toString());
  }, [step]);

  useEffect(() => {
    localStorage.setItem('companyData', JSON.stringify(companyData));
  }, [companyData]);


  const handleUploadComplete = (data: any) => {
    setCompanyData({ 
      ...companyData, 
      uploadedData: data.uploadedData 
    });
    setStep(3);
  };

  const handleGoToLogin = () => {
    localStorage.removeItem('onboardingStep');
    localStorage.removeItem('companyData');
    window.location.href = '/sign-in';
  };

const fetchUserCredentials = async (userId: string) => {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('acc_portal_clerk_users_duplicate')
    .select('username, password')
    .eq('userid', userId);
    console.log('fetching credentials:', data);

  if (error) {
    console.error('Error fetching credentials:', error);
    return null;
  }

  return data?.[0] || null;
};

const handleOnboardingComplete = async (data: any) => {
  console.log('Onboarding complete, data:', data);
  
  const credentials = await fetchUserCredentials(data.userId);
  
  setCompanyData({ 
    ...companyData, 
    name: data.name,
    username: credentials?.username || '',
    password: credentials?.password || '',
    userId: data.userId,
    company_name: data.name
  });
  
  setStep(2);
};

useEffect(() => {
  const updateCredentials = async () => {
    if (companyData.userId) {
      const credentials = await fetchUserCredentials(companyData.userId);
      if (credentials) {
        setCompanyData(prev => ({
          ...prev,
          username: credentials.username,
          password: credentials.password
        }));
      }
    }
  };
  updateCredentials();
}, [companyData.userId]);

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
                  <p><span className="font-medium">Username:</span> {companyData.username || 'Loading...'}</p>
                  <p><span className="font-medium">Password:</span> {companyData.password || 'Loading...'}</p>
                  <p><span className="font-medium">Uploaded Records:</span> {companyData.uploadedData?.length || 0}</p>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                >
                  Back to Onboarding
                </Button>
                <Button
                  onClick={handleGoToLogin}
                >
                  Go to Login
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}