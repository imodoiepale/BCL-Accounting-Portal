// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

const BranchesTab = ({ supabase, userId }) => {
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState({ name: '', location: '' });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('user_id', userId);
    if (error) console.error('Error fetching branches:', error);
    else setBranches(data);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewBranch((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('branches')
      .insert([{ ...newBranch, user_id: userId }]);
    if (error) console.error('Error adding branch:', error);
    else {
      fetchBranches();
      setNewBranch({ name: '', location: '' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branches</CardTitle>
        <Sheet>
          <SheetTrigger asChild>
            <Button>Add New Branch</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add New Branch</SheetTitle>
              <SheetDescription>Enter the details of the new branch.</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Branch Name</Label>
                <Input id="name" value={newBranch.name} onChange={handleInputChange} placeholder="Enter branch name" />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={newBranch.location} onChange={handleInputChange} placeholder="Enter branch location" />
              </div>
              <Button onClick={handleSubmit}>Submit</Button>
            </div>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch Name</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell>{branch.name}</TableCell>
                <TableCell>{branch.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default BranchesTab;