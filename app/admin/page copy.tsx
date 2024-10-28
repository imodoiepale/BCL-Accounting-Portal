//@ts-nocheck
"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const Page = () => {
  const [clientData, setClientData] = useState(null);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to fetch users: ${errorData.error}. Details: ${errorData.details || 'No additional details'}`);
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No users found or invalid data format');
        }
        setClients(data);
        setFilteredClients(data);
        setSelectedClientId(data[0].id);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients
      .filter(client => client.username.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.username.localeCompare(b.username);
        } else {
          return b.username.localeCompare(a.username);
        }
      });
    setFilteredClients(filtered);
  }, [searchTerm, sortOrder, clients]);

  useEffect(() => {
    if (selectedClientId && filteredClients.length > 0) {
      const selectedClient = filteredClients.find(client => client.id === selectedClientId);
      setClientData(selectedClient);
    }
  }, [selectedClientId, filteredClients]);

  if (isLoading) {
    return <p className="text-center text-gray-500">Loading...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
  }

  if (filteredClients.length === 0) {
    return <p className="text-center text-gray-500">No clients found.</p>;
  }

  return (
    <main className="p-4 bg-gray-100 min-h-screen">
      <div className="flex flex-col md:flex-row bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Clients Column */}
        <div className="w-full md:w-1/6 border-r flex flex-col bg-gray-50">
          <header className="bg-background border-b px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-700">Companies</h2>
          </header>
          <div className="p-4">
            <Input 
              type="text" 
              placeholder="Search companies..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            <Select 
              onValueChange={(value) => setSortOrder(value)} 
              value={sortOrder}
            >
              <SelectTrigger className="mb-4">
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Sort A-Z</SelectItem>
                <SelectItem value="desc">Sort Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-grow p-4">
            {filteredClients.map((client) => (
              <Button
                key={client.id}
                variant="ghost"
                className={`w-full justify-start mb-2 rounded-lg ${selectedClientId === client.id ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                onClick={() => setSelectedClientId(client.id)}
              >
                <Avatar className="mr-2"></Avatar>
                {client.username}
              </Button>
            ))}
          </ScrollArea>
        </div>

        {/* Profile Column */}
        <div className="w-full md:w-5/6 flex flex-col">
          <header className="bg-background border-b px-4 py-3 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Profile</h2>
          </header>
          <Tabs defaultValue="profile" className="flex flex-col flex-grow">
            <ScrollArea className="w-full">
              <TabsList className="flex flex-wrap px-6 py-4 border-b">
                <TabsTrigger value="profile" className="text-gray-700">Profile</TabsTrigger>
                <TabsTrigger value="monthly-documents" className="text-gray-700">Monthly Documents</TabsTrigger>
                <TabsTrigger value="reports" className="text-gray-700">Reports</TabsTrigger>
                <TabsTrigger value="checklist" className="text-gray-700">Checklist</TabsTrigger>
                <TabsTrigger value="settings" className="text-gray-700">Settings</TabsTrigger>
                <TabsTrigger value="verifications" className="text-gray-700">Verifications</TabsTrigger>
                <TabsTrigger value="activities" className="text-gray-700">Activities</TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" className="pt-1" />
            </ScrollArea>

            <ScrollArea className="flex-grow p-4 bg-white">
              <TabsContent value="profile">
                {clientData && (
                  <div className="flex space-x-8 p-4">
                    <div className="bg-gray-300 flex items-center justify-center rounded-lg overflow-hidden" style={{ width: "200px", height: "200px" }}>
                      {clientData.avatar_url ? (
                        <Image src={clientData.avatar_url} alt="Client Image" width={200} height={200} className="object-cover rounded-lg" />
                      ) : (
                        <span className="text-xs text-gray-500">No Image</span>
                      )}
                    </div>
                    
                    <div className="pt-5">
                      <p className="text-sm text-gray-700"><strong>Username:</strong> {clientData.username}</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="monthly-documents">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Monthly Documents</h3>
                {/* Add monthly documents content here */}
              </TabsContent>

              <TabsContent value="reports">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Reports</h3>
                {/* Add reports content here */}
              </TabsContent>

              <TabsContent value="checklist">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Checklist</h3>
                {/* Add checklist content here */}
              </TabsContent>

              <TabsContent value="settings">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Settings</h3>
                {/* Add settings content here */}
              </TabsContent>

              <TabsContent value="verifications">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Verifications</h3>
                {/* Add verifications content here */}
              </TabsContent>

              <TabsContent value="activities">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Activities</h3>
                {/* Add activities content here */}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </main>
  );
};

export default Page;