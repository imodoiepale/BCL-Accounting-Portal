// @ts-nocheck
"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, Mail, Phone, Globe, MapPin, CreditCard, FileText, Calendar } from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

interface CompanyInfoProps {
  selectedUserId: string;
}

export function CompanyInfoTab({ selectedUserId }: CompanyInfoProps) {
  const { user } = useUser();
  const { userId } = useAuth();
  const [companyData, setCompanyData] = useState(null);
  const [directors, setDirectors] = useState([]);
  const [missingFields, setMissingFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchDirectors();
  }, []);

  const userIdentifier = selectedUserId || userId;

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!userIdentifier) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('acc_portal_company')
          .select('*')
          .eq('userid', userIdentifier)
          .single();

        if (error) throw error;
        setCompanyData(data);
      } catch (error) {
        console.error('Error fetching company data:', error);
        toast.error('Failed to fetch company data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [userIdentifier]);


  const fetchDirectors = async () => {
    try {
      const { data, error } = await supabase
        .from('acc_portal_directors')
        .select('*')
        .eq("userid", userId)

      if (error) throw error;

      setDirectors(data || []);
    } catch (error) {
      console.error('Error fetching directors:', error);
      setDirectors([]);
    }
  };

  const checkMissingFields = (data) => {
    const requiredFields = [
      'company_name', 'company_type','description', 'registration_number', 'date_established', 'kra_pin_number',
      'industry', 'employees', 'annual_revenue', 'fiscal_year', 'website',
      'email', 'phone', 'street', 'city', 'postal_code', 'country'
    ];
    const missing = requiredFields.filter(field => !data[field]);
    setMissingFields(missing);
    setFormData(Object.fromEntries(missing.map(field => [field, ''])));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Exclude the 'id' field from the upsert operation
      const { id, ...companyDataWithoutId } = companyData;
      const { id: formDataId, ...formDataWithoutId } = formData;
  
      const { data, error } = await supabase
        .from('acc_portal_company')
        .upsert(
          { ...companyDataWithoutId, ...formDataWithoutId, userid: userId },
          { onConflict: 'userid' }  // This tells Supabase to update the record with the existing userid
        )
        .select()
        .single();
  
      if (error) throw error;
  
      setCompanyData(data);
      checkMissingFields(data);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating company data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 w-full">
      {missingFields.length > 0 && (
        <Card className="bg-yellow-200 border border-red-600">
          <CardContent className="flex justify-between items-center p-4">
            <p className="text-yellow-800 font-extrabold text-md">Some company information is missing.</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className='animate-bounce'>Add Missing Info</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[1225px]">
                <DialogHeader>
                  <DialogTitle>Add Missing Information</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-4 gap-4 capitalize">
                  {missingFields.map((field) => (
                    <div key={field} className={`space-y-2 ${field === 'description' ? 'col-span-4' : ''}`}>
                      <Label htmlFor={field}>{field.replace(/_/g, ' ')}</Label>
                      {field === 'company_type' ? (
                        <Select 
                          onValueChange={(value) => handleInputChange(field, value)}
                          value={formData[field]}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select company type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Private Limited Company">Private Limited Company</SelectItem>
                            <SelectItem value="Public Limited Company">Public Limited Company</SelectItem>
                            <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                            <SelectItem value="Partnership">Partnership</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : field === 'industry' ? (
                        <Select 
                          onValueChange={(value) => handleInputChange(field, value)}
                          value={formData[field]}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Information Technology">Information Technology</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : field === 'description' ? (
                        <Textarea 
                          id={field}
                          value={formData[field]}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          rows={4}
                        />
                      ) : (
                        <Input 
                          id={field}
                          type={field === 'date_established' ? 'date' : 'text'}
                          value={formData[field]}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                  <Button type="submit" className="w-full col-span-4">Submit</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Building2 className="mr-2" />
            {companyData?.company_name || <span className="text-red-500">Missing Company Name</span>}
          </CardTitle>
          <Badge>{companyData?.company_type || <span className="text-red-500">Missing Company Type</span>}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{companyData?.description || <span className="text-red-500">Missing Description</span>}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Registration Number</h3>
              <p>{companyData?.registration_number || <span className="text-red-500">Missing</span>}</p>
            </div>
            <div>
              <h3 className="font-semibold">Date Established</h3>
              <p>{companyData?.date_established || <span className="text-red-500">Missing</span>}</p>
            </div>
            <div>
              <h3 className="font-semibold">KRA PIN Number</h3>
              <p>{companyData?.kra_pin_number || <span className="text-red-500">Missing</span>}</p>
            </div>
            <div>
              <h3 className="font-semibold">Industry</h3>
              <p>{companyData?.industry || <span className="text-red-500">Missing</span>}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Company Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Users className="mr-2" />
                <span className="font-semibold mr-2">Employees:</span>
                {companyData?.employees || <span className="text-red-500">Missing</span>}
              </li>
              <li className="flex items-center">
                <CreditCard className="mr-2" />
                <span className="font-semibold mr-2">Annual Revenue:</span>
                {companyData?.annual_revenue || <span className="text-red-500">Missing</span>}
              </li>
              <li className="flex items-center">
                <Calendar className="mr-2" />
                <span className="font-semibold mr-2">Fiscal Year:</span>
                {companyData?.fiscal_year || <span className="text-red-500">Missing</span>}
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
            <li className="flex items-center">
              <Globe className="mr-2" />
              {companyData?.website ? (
                <Link href={`https://${companyData?.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {companyData?.website}
                </Link>
              ) : (
                <span className="text-red-500">Missing Website</span>
              )}
            </li>
            <li className="flex items-center">
              <Mail className="mr-2" />
              {companyData?.email ? (
                <Link href={`mailto:${companyData?.email}`} className="text-blue-500 hover:underline">
                  {companyData?.email}
                </Link>
              ) : (
                <span className="text-red-500">Missing Email</span>
              )}
            </li>
              <li className="flex items-center">
                <Phone className="mr-2" />
                {companyData?.phone || <span className="text-red-500">Missing Phone</span>}
              </li>
              <li className="flex items-center">
                <MapPin className="mr-2" />
                {companyData?.street && companyData?.city && companyData?.postal_code && companyData?.country ? (
                  `${companyData?.street}, ${companyData?.city}, ${companyData?.postal_code}, ${companyData?.country}`
                ) : (
                  <span className="text-red-500">Missing Address</span>
                )}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Directors</CardTitle>
        </CardHeader>
        <CardContent>
          {directors.length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {directors.map((director, index) => (
                <li key={index} className="flex items-center">
                  <Users className="mr-2" />
                  <span>
                    <span className="font-semibold">{director.full_name}</span> - {director.job_position}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-red-500">No directors information available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}