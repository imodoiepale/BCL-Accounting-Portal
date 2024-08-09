import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Mail, Phone, Globe, MapPin, CreditCard, FileText, Calendar } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export function CompanyInfoTab() {
  const { user } = useUser();
  
  const companyData = {
    name: "ABC Solutions Ltd",
    type: "Private Limited Company",
    registrationNumber: "C123456",
    dateEstablished: "2010-05-15",
    kraPinNumber: "P051234567X",
    industry: "Information Technology",
    employees: 250,
    annualRevenue: "$25 million",
    fiscalYear: "January 1 - December 31",
    website: "www.abc.com",
    email: "info@abc.com",
    phone: "+254 20 1234567",
    address: {
      street: "ABC Avenue, Silicon Street",
      city: "Nairobi",
      postalCode: "00100",
      country: "Kenya"
    },
    description: "ABC Solutions Ltd is a leading provider of innovative software solutions, specializing in artificial intelligence, cloud computing, and cybersecurity. With a decade of experience, we've established ourselves as a trusted partner for businesses seeking digital transformation across East Africa.",
    keyPersonnel: [
      { name: "Dr. John Doe", position: "Chief Executive Officer" },
      { name: "Mr. David Mutua", position: "Managing Director " },
      { name: "Ms. Shirlyne Hassan", position: "Managing Director " }
    ],
  };

  return (
    <div className="space-y-6 w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Building2 className="mr-2" />
            {companyData.name}
          </CardTitle>
          <Badge>{companyData.type}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{companyData.description}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Registration Number</h3>
              <p>{companyData.registrationNumber}</p>
            </div>
            <div>
              <h3 className="font-semibold">Date Established</h3>
              <p>{companyData.dateEstablished}</p>
            </div>
            <div>
              <h3 className="font-semibold">KRA PIN Number</h3>
              <p>{companyData.kraPinNumber}</p>
            </div>
            <div>
              <h3 className="font-semibold">Industry</h3>
              <p>{companyData.industry}</p>
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
                <span className="font-semibold mr-2">Employees:</span> {companyData.employees}
              </li>
              <li className="flex items-center">
                <CreditCard className="mr-2" />
                <span className="font-semibold mr-2">Annual Revenue:</span> {companyData.annualRevenue}
              </li>
              <li className="flex items-center">
                <Calendar className="mr-2" />
                <span className="font-semibold mr-2">Fiscal Year:</span> {companyData.fiscalYear}
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
                <a href={`https://${companyData.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{companyData.website}</a>
              </li>
              <li className="flex items-center">
                <Mail className="mr-2" />
                <a href={`mailto:${companyData.email}`} className="text-blue-500 hover:underline">{companyData.email}</a>
              </li>
              <li className="flex items-center">
                <Phone className="mr-2" />
                {companyData.phone}
              </li>
              <li className="flex items-center">
                <MapPin className="mr-2" />
                {`${companyData.address.street}, ${companyData.address.city}, ${companyData.address.postalCode}, ${companyData.address.country}`}
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
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {companyData.keyPersonnel.map((person, index) => (
              <li key={index} className="flex items-center">
                <Users className="mr-2" />
                <span>
                  <span className="font-semibold">{person.name}</span> - {person.position}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};