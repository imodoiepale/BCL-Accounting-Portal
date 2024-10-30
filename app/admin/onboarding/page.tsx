// @ts-nocheck
// @ts-ignore
"use client";

  import { useState } from "react";
  import OnboardingPage from "./onboarding";
  import Upload from "./upload";

  export default function Page() {
    const [step, setStep] = useState(1);
    const [companyData, setCompanyData] = useState({
      company_name: "",
      username: "",
      password: "",
    });

    const handleStepComplete = (data: any) => {
      setCompanyData({ ...companyData, ...data });
      setStep(step + 1);
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
              <OnboardingPage onComplete={handleStepComplete} />
            )}
            {step === 2 && (
              <Upload onComplete={handleStepComplete} />
            )}
            {step === 3 && (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-green-600 mb-4">
                  {companyData.company_name} onboarded successfully!
                </h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Company Credentials</h3>
                  <p className="mb-2"><span className="font-medium">Username:</span> {companyData.username}</p>
                  <p><span className="font-medium">Password:</span> {companyData.password}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
