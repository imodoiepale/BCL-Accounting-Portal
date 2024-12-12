// @ts-nocheck
"use client";

import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { usePathname } from "next/navigation";

interface OnboardingPageProps {
  onComplete: (data: any) => void;
}

interface ClientType {
  type: string;
  wef: string;
  to: string;
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { signUp, setActive } = useSignUp();
  const router = useRouter();
  const [selectedTypes, setSelectedTypes] = useState<ClientType[]>([]);
  const [existingCompanies, setExistingCompanies] = useState([]);

  // Form states
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyUsername, setNewCompanyUsername] = useState("");
  const [newCompanyPassword, setNewCompanyPassword] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");

  const resetInputs = () => {
    setNewCompanyName("");
    setNewCompanyUsername("");
    setNewCompanyPassword("");
    setErrorMessage("");
  };

  useEffect(() => {
    const fetchExistingCompanies = async () => {
      const { data } = await supabase
        .from('acc_portal_company_duplicate2')
        .select('*')
      
      if (data) {
        setExistingCompanies(data);
      }
    };
  
    fetchExistingCompanies();
  }, []);

  const handleCompanySelect = (value: string) => {
    setSelectedCompany(value);
  };

const handleExistingCompanySubmit = async () => {
  setLoading(true);
  try {
    if (!signUp) throw new Error("Sign up is not initialized");

    await signUp.create({
      username: newCompanyUsername.trim(),
      password: newCompanyPassword,
      firstName: newCompanyName.trim(),
    });

    const response = await fetch("/api/create-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        existingCompany: true,
        companyId: selectedCompany,
        clientTypes: selectedTypes,
        username: newCompanyUsername.trim()
      }),
    });

    if (!response.ok) throw new Error("Failed to update company");

    toast.success("Company assigned successfully!");
    setIsOpen(false);
    
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};

  const handleAddClientType = () => {
    setSelectedTypes([...selectedTypes, { type: '', wef: '', to: '' }]);
  };

  const updateClientType = (index: number, field: keyof ClientType, value: string) => {
    const newTypes = [...selectedTypes];
    newTypes[index][field] = value;
    setSelectedTypes(newTypes);
  };

  const removeClientType = (index: number) => {
    setSelectedTypes(selectedTypes.filter((_, i) => i !== index));
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
  
    try {
      if (!signUp) {
        throw new Error("Sign up is not initialized");
      }
  
      // Basic validation
      if (!newCompanyName || !newCompanyUsername || !newCompanyPassword) {
        throw new Error("All fields are required");
      }
  
      if (!/^[a-zA-Z0-9_]+$/.test(newCompanyUsername)) {
        throw new Error("Username can only contain letters, numbers, and underscores");
      }
  
      if (newCompanyPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }
  
      // Create the user account
      try {
        await signUp.create({
          username: newCompanyUsername.trim(),
          password: newCompanyPassword,
          firstName: newCompanyName.trim(),
        });
      } catch (signUpError: any) {
        throw new Error(signUpError.errors?.[0]?.message || "Failed to create account");
      }
  
      // Update metadata through API
      let response;
      try {
        response = await fetch("/api/create-users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newCompanyName.trim(),
            username: newCompanyUsername.trim(),
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update company metadata");
        }
  
        const data = await response.json();
  
        if (!data.id) {
          throw new Error("Failed to get company ID");
        }
  
        // Success handling
        toast.success("Company account created successfully!");
        resetInputs();
        setIsOpen(false);
        
        onComplete({ 
          name: newCompanyName.trim(), 
          username: newCompanyUsername.trim(),
          userId: data.id 
        });
  
      } catch (apiError: any) {
        throw new Error(apiError.message || "API request failed");
      }
  
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred";
      console.error("Creation Error:", errorMsg);
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetInputs();
      }}>
        <DialogTrigger asChild>
          <Button variant="default">Onboard New Company</Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Company Onboarding</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New Company</TabsTrigger>
              <TabsTrigger value="existing">Existing Company</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new">
              <form onSubmit={handleAddCompany} className="space-y-4">
                {errorMessage && (
                  <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                    {errorMessage}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newCompanyUsername}
                    onChange={(e) => setNewCompanyUsername(e.target.value)}
                    placeholder="Enter username"
                    disabled={loading}
                    required
                    pattern="^[a-zA-Z0-9_]+$"
                    title="Username can only contain letters, numbers, and underscores"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newCompanyPassword}
                    onChange={(e) => setNewCompanyPassword(e.target.value)}
                    placeholder="Enter password"
                    disabled={loading}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="existing">
              <div className="space-y-4">
                <Select onValueChange={handleCompanySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing company" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingCompanies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <Label>Client Types</Label>
                  <Button type="button" onClick={handleAddClientType} className="mb-2">
                    Add Client Type
                  </Button>
                  {selectedTypes.map((type, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                      <Select onValueChange={(value) => updateClientType(index, 'type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Accounting', 'Sheria', 'Immigration', 'Audit'].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        value={type.wef}
                        onChange={(e) => updateClientType(index, 'wef', e.target.value)}
                        placeholder="WEF"
                      />
                      <Input
                        type="date"
                        value={type.to}
                        onChange={(e) => updateClientType(index, 'to', e.target.value)}
                        placeholder="To"
                      />
                      <Button type="button" onClick={() => removeClientType(index)} variant="destructive">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleExistingCompanySubmit}
                  className="w-full"
                >
                  Assign Company
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
