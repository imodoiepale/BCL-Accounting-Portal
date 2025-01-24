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
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [departments, setDepartments] = useState({});
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
  const [activeCategory, setActiveCategory] = useState("");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isManageStructureDialogOpen, setIsManageStructureDialogOpen] = useState(false);
  const [newStructureItem, setNewStructureItem] = useState({
    categories: [""],
    subcategories: [{
      name: "",
      departments: [""]
    }]
  });

  useEffect(() => {
    fetchCategories();
    fetchDepartments();
    fetchDocuments();
  }, [activeCategory, activeSubcategory]);

  const fetchCategories = async () => {
    // Fetch distinct categories using select with distinct option
    const { data: categoryData, error: categoryError } = await supabase
      .from('acc_portal_kyc')
      .select('category', { count: 'exact', head: false })
      .not('category', 'is', null);

    if (categoryError) {
      console.error('Error fetching categories:', categoryError);
      toast.error('Failed to fetch categories');
      return;
    }

    // Get unique categories
    const uniqueCategories = [...new Set(categoryData.map(item => item.category))];

    // Fetch distinct subcategories for each category
    const subcategoriesMap = {};
    for (const category of uniqueCategories) {
      const { data: subData, error: subError } = await supabase
        .from('acc_portal_kyc')
        .select('subcategory')
        .eq('category', category)
        .not('subcategory', 'is', null)
        .not('subcategory', 'eq', 'NULL');

      if (!subError && subData) {
        // Get unique subcategories
        const uniqueSubcategories = [...new Set(subData.map(item => item.subcategory))];
        
        subcategoriesMap[category] = uniqueSubcategories
          .filter(Boolean)
          .map(sub => ({
            value: sub,
            label: sub.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')
          }));
      }
    }

    setCategories(uniqueCategories);
    setSubcategories(subcategoriesMap);
    
    // Set initial active category if not already set
    if (!activeCategory && uniqueCategories.length > 0) {
      setActiveCategory(uniqueCategories[0]);
    }
  };

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('acc_portal_kyc')
      .select('category, department')
      .not('department', 'is', null);

    if (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
      return;
    }

    // Group departments by category
    const deptsByCategory = data.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = new Set();
      }
      if (item.department) {
        acc[item.category].add(item.department);
      }
      return acc;
    }, {});

    // Convert Sets to arrays
    const departmentsMap = Object.keys(deptsByCategory).reduce((acc, category) => {
      acc[category] = Array.from(deptsByCategory[category]);
      return acc;
    }, {});

    setDepartments(departmentsMap);
  };

  const getDepartmentOptions = (category) => {
    if (category === "directors-docs") {
      return ["Directors"];
    }
    return departments[category] || [];
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

  const filterDocuments = (docs) => {
    return docs.filter(
      (doc) =>
        (doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         doc.department?.toLowerCase().includes(searchTerm.toLowerCase())) ?? false
    );
  };

  const sortDocuments = (docs) => {
    return [...docs].sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortDirection === "asc") {
        return aValue.toLowerCase() > bValue.toLowerCase() ? 1 : -1;
      }
      return aValue.toLowerCase() < bValue.toLowerCase() ? 1 : -1;
    });
  };

  const renderDocumentTable = (category, subcategory) => {
    const filteredDocs = documents.filter(
      (doc) =>
        doc.category === category &&
        (!subcategory || doc.subcategory === subcategory)
    );

    const filteredAndSortedDocs = sortDocuments(
      filterDocuments(filteredDocs)
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
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
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
                    {doc.name || '-'}
                  </TableCell>
                  <TableCell className="py-3 px-6 text-sm text-gray-600">
                    {doc.validity_days || "N/A"}
                  </TableCell>
                  <TableCell className="py-3 px-6 text-sm text-gray-600">
                    {doc.department || '-'}
                  </TableCell>
                  <TableCell className="py-3 px-6 text-sm text-gray-600">
                    {doc.document_type || '-'}
                  </TableCell>
                  <TableCell className="py-3 px-6">
                    <Switch
                      checked={doc.listed || false}
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
                        onClick={() => {
                          setDocumentToDelete(doc.id);
                          setIsDeleteDialogOpen(true);
                        }}
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
        activeCategory === "directors-docs"
          ? "Directors"
          : newDocument.department,
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

  const renderDeleteConfirmDialog = () => (
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Confirm Delete
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <p className="text-gray-700">
            Are you sure you want to delete this document? This action cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="outline"
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleDeleteDocument(documentToDelete);
                setIsDeleteDialogOpen(false);
                setDocumentToDelete(null);
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

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

  const handleAddField = (field) => {
    if (field === 'categories') {
      setNewStructureItem(prev => ({
        ...prev,
        categories: [...prev.categories, ""]
      }));
    } else if (field === 'subcategories') {
      setNewStructureItem(prev => ({
        ...prev,
        subcategories: [...prev.subcategories, { name: "", departments: [""] }]
      }));
    }
  };

  const handleRemoveField = (field, index) => {
    setNewStructureItem(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleAddDepartment = (subcategoryIndex) => {
    setNewStructureItem(prev => ({
      ...prev,
      subcategories: prev.subcategories.map((sub, index) => 
        index === subcategoryIndex
          ? { ...sub, departments: [...sub.departments, ""] }
          : sub
      )
    }));
  };

  const handleRemoveDepartment = (subcategoryIndex, departmentIndex) => {
    setNewStructureItem(prev => ({
      ...prev,
      subcategories: prev.subcategories.map((sub, index) => 
        index === subcategoryIndex
          ? {
              ...sub,
              departments: sub.departments.filter((_, i) => i !== departmentIndex)
            }
          : sub
      )
    }));
  };

  const handleFieldChange = (field, index, value) => {
    if (field === 'categories') {
      setNewStructureItem(prev => ({
        ...prev,
        categories: prev.categories.map((item, i) => i === index ? value : item)
      }));
    } else if (field === 'subcategories') {
      setNewStructureItem(prev => ({
        ...prev,
        subcategories: prev.subcategories.map((item, i) => 
          i === index ? { ...item, name: value } : item
        )
      }));
    }
  };

  const handleDepartmentChange = (subcategoryIndex, departmentIndex, value) => {
    setNewStructureItem(prev => ({
      ...prev,
      subcategories: prev.subcategories.map((sub, index) => 
        index === subcategoryIndex
          ? {
              ...sub,
              departments: sub.departments.map((dept, i) => 
                i === departmentIndex ? value : dept
              )
            }
          : sub
      )
    }));
  };

  const handleAddStructureItem = async () => {
    const { categories, subcategories } = newStructureItem;

    if (!categories[0]) {
      toast.error("At least one category is required");
      return;
    }

    try {
      // Insert categories
      for (const category of categories.filter(Boolean)) {
        const { error: catError } = await supabase
          .from('acc_portal_kyc')
          .insert([{ 
            category,
            department: 'Default',
            name: null
          }]);

        if (catError) throw catError;

        // Insert subcategories with their departments
        for (const sub of subcategories) {
          if (sub.name && sub.departments[0]) {
            for (const department of sub.departments.filter(Boolean)) {
              const { error: subError } = await supabase
                .from('acc_portal_kyc')
                .insert([{ 
                  category,
                  subcategory: sub.name,
                  department,
                  name: null
                }]);
              
              if (subError) throw subError;
            }
          }
        }
      }

      toast.success("Structure items added successfully");
      setNewStructureItem({
        categories: [""],
        subcategories: [{
          name: "",
          departments: [""]
        }]
      });
      fetchCategories();
      fetchDepartments();
      setIsManageStructureDialogOpen(false);
    } catch (error) {
      console.error("Error adding structure:", error);
      toast.error("Failed to add structure items");
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
                    <h2 className="text-lg font-semibold text-gray-800">
                      {subcategory.label}
                    </h2>
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
              {category.split("-")[0].charAt(0).toUpperCase() +
                category.split("-")[0].slice(1)}{" "}
              Documents
            </h2>
          </CardHeader>
          <CardContent className="p-6">
            {renderDocumentTable(category, "")}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderManageStructureDialog = () => (
    <Dialog open={isManageStructureDialogOpen} onOpenChange={setIsManageStructureDialogOpen}>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Manage Structure Items
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto">
          {/* Categories Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                Categories
              </label>
              <Button
                type="button"
                onClick={() => handleAddField('categories')}
                className="px-2 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Category
              </Button>
            </div>
            {newStructureItem.categories.map((category, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={category}
                  onChange={(e) => handleFieldChange('categories', index, e.target.value)}
                  className="w-full"
                  placeholder="Enter category name"
                />
                {newStructureItem.categories.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => handleRemoveField('categories', index)}
                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Subcategories with Departments Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                Subcategories and Departments
              </label>
              <Button
                type="button"
                onClick={() => handleAddField('subcategories')}
                className="px-2 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Subcategory
              </Button>
            </div>
            {newStructureItem.subcategories.map((subcategory, subIndex) => (
              <div key={subIndex} className="p-4 border rounded-lg space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={subcategory.name}
                    onChange={(e) => handleFieldChange('subcategories', subIndex, e.target.value)}
                    className="w-full"
                    placeholder="Enter subcategory name"
                  />
                  {newStructureItem.subcategories.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => handleRemoveField('subcategories', subIndex)}
                      className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                
                <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">
                      Departments
                    </label>
                    <Button
                      type="button"
                      onClick={() => handleAddDepartment(subIndex)}
                      className="px-2 py-1 text-sm bg-green-600 hover:bg-green-700 text-white"
                    >
                      Add Department
                    </Button>
                  </div>
                  {subcategory.departments.map((department, deptIndex) => (
                    <div key={deptIndex} className="flex gap-2">
                      <Input
                        value={department}
                        onChange={(e) => handleDepartmentChange(subIndex, deptIndex, e.target.value)}
                        className="w-full"
                        placeholder="Enter department name"
                      />
                      {subcategory.departments.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveDepartment(subIndex, deptIndex)}
                          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleAddStructureItem}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Structure Items
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderAddDocumentDialog = () => (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Add New Document
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddDocument();
          }}
          className="space-y-4 mt-4"
        >
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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold py-6 text-gray-800">Settings</h1>
            <Button
              onClick={() => setIsManageStructureDialogOpen(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
            >
              Manage Structure
            </Button>
          </div>
          <Tabs
            defaultValue={categories[0] || ""}
            className="w-full"
            onValueChange={(value) => setActiveCategory(value)}
          >
            <TabsList className="w-full flex bg-gray-50 px-6 py-3 border-b border-gray-200 whitespace-nowrap overflow-x-auto">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:bg-gray-100 data-[state=active]:hover:bg-blue-700 mx-1"
                >
                  {category.split('-')[0].charAt(0).toUpperCase() + 
                   category.split('-')[0].slice(1)} Documents
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="w-full py-6">
              {categories.map((category) => (
                <TabsContent key={category} value={category}>
                  {renderCategoryContent(category, subcategories[category] || [])}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </div>
      {renderAddDocumentDialog()}
      {renderEditDocumentDialog()}
      {renderDeleteConfirmDialog()}
      {renderManageStructureDialog()}
    </div>
  );
};

export default SettingsPage;
