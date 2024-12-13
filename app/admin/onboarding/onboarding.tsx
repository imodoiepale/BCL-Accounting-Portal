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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OnboardingPageProps {
  onComplete: (data: any) => void;
}

interface ClientFields {
  acc_client: string;
  acc_client_effective_from: string;
  acc_client_effective_to: string;
  acc_client_status: string;
  sheria_client: string;
  sheria_client_effective_from: string;
  sheria_client_effective_to: string;
  sheria_client_status: string;
  imm_client: string;
  imm_client_effective_from: string;
  imm_client_effective_to: string;
  imm_client_status: string;
  audit_client: string;
  audit_client_effective_from: string;
  audit_client_effective_to: string;
  audit_client_status: string;
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { signUp, setActive } = useSignUp();
  const router = useRouter();
  const [existingCompanies, setExistingCompanies] = useState([]);

  // Form states
  const [newCompanyName, setNewCompanyName] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [clientFields, setClientFields] = useState<ClientFields>({
    acc_client: 'No',
    acc_client_effective_from: '',
    acc_client_effective_to: '',
    acc_client_status: 'Active',
    sheria_client: 'No',
    sheria_client_effective_from: '',
    sheria_client_effective_to: '',
    sheria_client_status: 'Active',
    imm_client: 'No',
    imm_client_effective_from: '',
    imm_client_effective_to: '',
    imm_client_status: 'Active',
    audit_client: 'No',
    audit_client_effective_from: '',
    audit_client_effective_to: '',
    audit_client_status: 'Active'
  });

  const resetInputs = () => {
    setNewCompanyName("");
    setErrorMessage("");
    setClientFields({
      acc_client: 'No',
      acc_client_effective_from: '',
      acc_client_effective_to: '',
      acc_client_status: 'Active',
      sheria_client: 'No',
      sheria_client_effective_from: '',
      sheria_client_effective_to: '',
      sheria_client_status: 'Active',
      imm_client: 'No',
      imm_client_effective_from: '',
      imm_client_effective_to: '',
      imm_client_status: 'Active',
      audit_client: 'No',
      audit_client_effective_from: '',
      audit_client_effective_to: '',
      audit_client_status: 'Active'
    });
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

 // Update handleExistingCompanySubmit
const handleExistingCompanySubmit = async () => {
  setLoading(true);
  try {
    const updates = {};
    Object.entries(clientFields).forEach(([key, value]) => {
      if (key.includes('client') && value) {
        updates[key] = value;
      }
    });

    const { data, error } = await supabase
      .from('acc_portal_company_duplicate2')
      .update(updates)
      .eq('id', selectedCompany)
      .select()
      .single();

    if (error) throw error;

    toast.success("Company assigned successfully!");
    setIsOpen(false);

    // Call onComplete with the selected company data
    onComplete({
      name: data.company_name,
      userId: data.id
    });

  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (!signUp) {
        throw new Error("Sign up is not initialized");
      }

      if (!newCompanyName) {
        throw new Error("Company name is required");
      }

      const companyData = {
        company_name: newCompanyName.trim(),
        status: 'Active',
        ...clientFields
      };

      const { data, error } = await supabase
        .from('acc_portal_company_duplicate2')
        .insert([companyData])
        .select();

      if (error) throw error;

      toast.success("Company account created successfully!");
      resetInputs();
      setIsOpen(false);

      if (data && data[0]) {
        onComplete({
          name: newCompanyName.trim(),
          userId: data[0].id
        });
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
        <DialogContent className="max-w-4xl">
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

                <div className="space-y-6">
                  {['acc', 'sheria', 'imm', 'audit'].map((type) => (
                    <div key={type} className="p-6 border rounded-lg">
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                        <Label className="text-sm font-medium">{type.charAt(0).toUpperCase() + type.slice(1)} Client</Label>
                        <Select
                            value={clientFields[`${type}_client`]}
                            onValueChange={(value) => setClientFields({
                              ...clientFields,
                              [`${type}_client`]: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${type} client`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Effective From</Label>
                          <Input
                            type="date"
                            value={clientFields[`${type}_client_effective_from`]}
                            onChange={(e) => setClientFields({
                              ...clientFields,
                              [`${type}_client_effective_from`]: e.target.value
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Effective To</Label>
                          <Input
                            type="date"
                            value={clientFields[`${type}_client_effective_to`]}
                            onChange={(e) => setClientFields({
                              ...clientFields,
                              [`${type}_client_effective_to`]: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
                    <SelectGroup>
                      {existingCompanies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.company_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <div className="space-y-6">
                  {['acc', 'sheria', 'imm', 'audit'].map((type) => (
                    <div key={type} className="p-6 border rounded-lg">
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                        <Label className="text-sm font-medium">{type.charAt(0).toUpperCase() + type.slice(1)} Client</Label>
                        <Select
                            value={clientFields[`${type}_client`]}
                            onValueChange={(value) => setClientFields({
                              ...clientFields,
                              [`${type}_client`]: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${type} client`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Effective From</Label>
                          <Input
                            type="date"
                            value={clientFields[`${type}_client_effective_from`]}
                            onChange={(e) => setClientFields({
                              ...clientFields,
                              [`${type}_client_effective_from`]: e.target.value
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Effective To</Label>
                          <Input
                            type="date"
                            value={clientFields[`${type}_client_effective_to`]}
                            onChange={(e) => setClientFields({
                              ...clientFields,
                              [`${type}_client_effective_to`]: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleExistingCompanySubmit}
                  className="w-full mt-6"
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