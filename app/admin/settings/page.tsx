//@ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SettingsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [newDocument, setNewDocument] = useState({
    name: "",
    category: "",
    subcategory: "",
    validity_days: "",
    department: "",
    document_type: "one-off",
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [activeCategory, setActiveCategory] = useState("company-docs");
  const [activeSubcategory, setActiveSubcategory] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, [activeCategory, activeSubcategory]);

  const getDepartmentOptions = (category) => {
    switch (category) {
      case "company-docs":
        return ["Sheria House", "KRA"];
      case "directors-docs":
        return ["Directors"];
      default:
        return ["Other"];
    }
  };

  const fetchDocuments = async () => {
    let query = supabase
      .from("acc_portal_kyc")
      .select("*")
      .eq("category", activeCategory);

    if (activeSubcategory) {
      query = query.eq("subcategory", activeSubcategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch documents");
    } else {
      setDocuments(data);
    }
  };

  const sortDocuments = (docs) => {
    return [...docs].sort((a, b) => {
      if (sortDirection === "asc") {
        return a[sortField] > b[sortField] ? 1 : -1;
      }
      return a[sortField] < b[sortField] ? 1 : -1;
    });
  };

  const filterDocuments = (docs) => {
    return docs.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDocument((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingDocument((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDocument = async () => {
    const newDoc = {
      ...newDocument,
      category: activeCategory,
      subcategory: activeSubcategory || "",
      validity_days:
        newDocument.document_type === "renewal"
          ? parseInt(newDocument.validity_days)
          : null,
      department:
        activeCategory === "directors-docs" ? "Directors" : newDocument.department,
    };

    const { data, error } = await supabase
      .from("acc_portal_kyc")
      .insert([newDoc]);

    if (error) {
      console.error("Error adding document:", error);
      toast.error("Failed to add document");
    } else {
      fetchDocuments();
      setNewDocument({
        name: "",
        validity_days: "",
        department: "",
        document_type: "one-off",
      });
      setIsAddDialogOpen(false);
      toast.success("Document added successfully");
    }
  };

  const handleEditDocument = async () => {
    const { data, error } = await supabase
      .from("acc_portal_kyc")
      .update({
        name: editingDocument.name,
        validity_days:
          editingDocument.document_type === "renewal"
            ? parseInt(editingDocument.validity_days)
            : null,
        department:
          activeCategory === "directors-docs"
            ? "Directors"
            : editingDocument.department,
        document_type: editingDocument.document_type,
      })
      .eq("id", editingDocument.id);

    if (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
    } else {
      fetchDocuments();
      setIsEditDialogOpen(false);
      toast.success("Document updated successfully");
    }
  };

  const handleDeleteDocument = async (id) => {
    const { error } = await supabase
      .from("acc_portal_kyc")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } else {
      fetchDocuments();
      toast.success("Document deleted successfully");
    }
  };


  const renderCategoryContent = (category, subcategories) => (
    <div className="flex flex-col">
      {subcategories.length > 0 ? (
        <Tabs defaultValue={subcategories[0].value} className="w-full">
          <TabsList className="h-12 bg-gray-50 border-b border-gray-200 sticky top-0 z-10 px-6 space-x-3">
            {subcategories.map((subcategory) => (
              <TabsTrigger 
                key={subcategory.value} 
                value={subcategory.value} 
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:bg-gray-100 data-[state=active]:hover:bg-blue-700"
                onClick={() => setActiveSubcategory(subcategory.value)}
              >
                {subcategory.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex-1">
            {subcategories.map((subcategory) => (
              <TabsContent key={subcategory.value} value={subcategory.value}>
                <Card className="m-6 shadow-sm">
                  <CardHeader className="py-4 px-6">
                    <h2 className="text-lg font-semibold text-gray-800">{subcategory.label}</h2>
                  </CardHeader>
                  <CardContent className="p-6">
                    {renderDocumentTable(category, subcategory.value)}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      ) : (
        <Card className="m-6 shadow-sm">
          <CardHeader className="py-4 px-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {category.split("-")[0].charAt(0).toUpperCase() + category.split("-")[0].slice(1)} Documents
            </h2>
          </CardHeader>
          <CardContent className="p-6">
            {renderDocumentTable(category, "")}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const handleToggleListed = async (id, currentValue) => {
    const { error } = await supabase
      .from("acc_portal_kyc")
      .update({ listed: !currentValue })
      .eq("id", id);

    if (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
    } else {
      fetchDocuments();
      toast.success("Document listing updated");
    }
  };

  const renderDocumentTable = (category, subcategory) => {
    const filteredAndSortedDocs = sortDocuments(
      filterDocuments(
        documents.filter(
          (doc) =>
            doc.category === category &&
            (!subcategory || doc.subcategory === subcategory)
        )
      )
    );
  
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 flex-1">
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Select value={sortField} onValueChange={setSortField}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="document_type">Type</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() =>
                setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              variant="outline"
              className="px-4"
            >
              {sortDirection === "asc" ? "↑" : "↓"}
            </Button>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Add New Document
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16 py-4 px-6 text-sm font-semibold text-gray-700">
                  No.
                </TableHead>
                <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">
                  Document Name
                </TableHead>
                <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">
                  Validity Days
                </TableHead>
                <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">
                  Department
                </TableHead>
                <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">
                  Type
                </TableHead>
                <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">
                  Listed
                </TableHead>
                <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {filteredAndSortedDocs.map((doc, index) => (
                <TableRow
                  key={doc.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <TableCell className="py-3 px-6 text-sm text-gray-600">
                    {index + 1}
                  </TableCell>
                  <TableCell className="py-3 px-6 text-sm text-gray-700">
                    {doc.name}
                  </TableCell>
                  <TableCell className="py-3 px-6 text-sm text-gray-600">
                    {doc.validity_days || "N/A"}
                  </TableCell>
                  <TableCell className="py-3 px-6 text-sm text-gray-600">
                    {doc.department}
                  </TableCell>
                  <TableCell className="py-3 px-6 text-sm text-gray-600">
                    {doc.document_type}
                  </TableCell>
                  <TableCell className="py-3 px-6">
                    <Switch
                      checked={doc.listed}
                      onCheckedChange={() =>
                        handleToggleListed(doc.id, doc.listed)
                      }
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </TableCell>
                  <TableCell className="py-3 px-6">
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => {
                          setEditingDocument(doc);
                          setIsEditDialogOpen(true);
                        }}
                        className="px-4 py-2 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors rounded-lg shadow-sm hover:shadow"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="px-4 py-2 text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors rounded-lg shadow-sm hover:shadow"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderAddDocumentDialog = () => (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Add New Document
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleAddDocument();
        }} className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Document Name
              </label>
              <Input
                name="name"
                value={newDocument.name}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>
  
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Document Type
              </label>
              <Select
                name="document_type"
                value={newDocument.document_type}
                onValueChange={(value) =>
                  setNewDocument((prev) => ({ ...prev, document_type: value }))
                }
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-off">One-off</SelectItem>
                  <SelectItem value="renewal">Renewal</SelectItem>
                </SelectContent>
              </Select>
            </div>
  
            {newDocument.document_type === "renewal" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Validity Days
                </label>
                <Input
                  name="validity_days"
                  type="number"
                  value={newDocument.validity_days}
                  onChange={handleInputChange}
                  className="w-full"
                  required
                />
              </div>
            )}
  
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Department
              </label>
              <Select
                name="department"
                value={newDocument.department}
                onValueChange={(value) =>
                  setNewDocument((prev) => ({ ...prev, department: value }))
                }
                disabled={activeCategory === "directors-docs"}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {getDepartmentOptions(activeCategory).map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
  
            <Button
              type="submit"
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
  

  const renderEditDocumentDialog = () => (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Edit Document
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Document Name
            </label>
            <Input
              name="name"
              value={editingDocument?.name || ""}
              onChange={handleEditInputChange}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Document Type
            </label>
            <Select
              name="document_type"
              value={editingDocument?.document_type || "one-off"}
              onValueChange={(value) =>
                setEditingDocument((prev) => ({
                  ...prev,
                  document_type: value,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-off">One-off</SelectItem>
                <SelectItem value="renewal">Renewal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editingDocument?.document_type === "renewal" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Validity Days
              </label>
              <Input
                name="validity_days"
                type="number"
                value={editingDocument?.validity_days || ""}
                onChange={handleEditInputChange}
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Department
            </label>
            <Select
              name="department"
              value={editingDocument?.department || ""}
              onValueChange={(value) =>
                setEditingDocument((prev) => ({ ...prev, department: value }))
              }
              disabled={activeCategory === "directors-docs"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {getDepartmentOptions(activeCategory).map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleEditDocument}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Update Document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-md">
        <div className="w-full px-6">
          <h1 className="text-2xl font-bold py-6 text-gray-800">Settings</h1>
          <Tabs
            defaultValue="company-docs"
            className="w-full"
            onValueChange={(value) => setActiveCategory(value)}
          >
            <TabsList className="w-full flex bg-gray-50 px-6 py-3 border-b border-gray-200 whitespace-nowrap">
              {[
                "company-docs",
                "directors-docs",
                "suppliers-docs",
                "banks-docs",
                "employees-docs",
                "insurance-docs",
                "deposits-docs",
                "fixed-assets-docs",
              ].map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:bg-gray-100 data-[state=active]:hover:bg-blue-700 mx-1"
                >
                  {category.split("-")[0].charAt(0).toUpperCase() +
                    category.split("-")[0].slice(1)}{" "}
                  Documents
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="w-full py-6">
              <TabsContent value="company-docs">
                {renderCategoryContent("company-docs", [
                  { value: "kra-docs", label: "KRA Documents" },
                  { value: "sheria-docs", label: "Sheria Documents" },
                ])}
              </TabsContent>

              <TabsContent value="directors-docs">
                {renderCategoryContent("directors-docs", [])}
              </TabsContent>

              <TabsContent value="suppliers-docs">
                {renderCategoryContent("suppliers-docs", [
                  {
                    value: "monthly-service-vendors-docs",
                    label: "Monthly Service Vendors - Documents",
                  },
                  {
                    value: "trading-suppliers-docs",
                    label: "Trading Suppliers - Documents",
                  },
                ])}
              </TabsContent>

              <TabsContent value="banks-docs">
                {renderCategoryContent("banks-docs", [])}
              </TabsContent>

              <TabsContent value="employees-docs">
                {renderCategoryContent("employees-docs", [])}
              </TabsContent>

              <TabsContent value="insurance-docs">
                {renderCategoryContent("insurance-docs", [])}
              </TabsContent>

              <TabsContent value="deposits-docs">
                {renderCategoryContent("deposits-docs", [])}
              </TabsContent>

              <TabsContent value="fixed-assets-docs">
                {renderCategoryContent("fixed-assets-docs", [
                  { value: "comp-equip-docs", label: "Computer & Equipment" },
                  {
                    value: "furniture-fitting-docs",
                    label: "Furniture Fitting & Equipment 12.5%",
                  },
                  { value: "land-building-docs", label: "Land & Building" },
                  {
                    value: "plant-equip-docs",
                    label: "Plant & Equipment - 12.5%",
                  },
                  {
                    value: "motor-vehicles-docs",
                    label: "Motor Vehicles - 25%",
                  },
                ])}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      {renderAddDocumentDialog()}
      {renderEditDocumentDialog()}
    </div>
  );
};

export default SettingsPage;