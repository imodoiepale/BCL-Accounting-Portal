//@ts-nocheck

"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SettingsPage = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [kraDocuments, setKraDocuments] = useState([]);
  const [sheriaDocuments, setSheriaDocuments] = useState([]);

  useEffect(() => {
    fetchDocuments('KRA');
    fetchDocuments('Sheria House');
  }, []);

  const fetchDocuments = async (department) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('department', department);
    if (error) console.error('Error fetching documents:', error);
    else {
      if (department === 'KRA') setKraDocuments(data);
      if (department === 'Sheria House') setSheriaDocuments(data);
    }
  };

  const handleInputChange = (e, index, department) => {
    const { name, value } = e.target;
    const updatedDocuments = department === 'KRA' ? [...kraDocuments] : [...sheriaDocuments];
    updatedDocuments[index][name] = value;
    department === 'KRA' ? setKraDocuments(updatedDocuments) : setSheriaDocuments(updatedDocuments);
  };

  const handleSave = async (document, department) => {
    const { error } = await supabase
      .from('documents')
      .upsert(document, { onConflict: ['id'] });
    if (error) console.error('Error saving document:', error);
    else fetchDocuments(department);
  };

  const renderDocumentTable = (documents, department) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document Name</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Issue Date</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Validity Days</TableHead>
          <TableHead>Reminder Days</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc, index) => (
          <TableRow key={index}>
            <TableCell>
              <Input
                name="name"
                value={doc.name}
                onChange={(e) => handleInputChange(e, index, department)}
              />
            </TableCell>
            <TableCell>{doc.department}</TableCell>
            <TableCell>
              <Input
                name="issueDate"
                value={doc.issue_date}
                onChange={(e) => handleInputChange(e, index, department)}
              />
            </TableCell>
            <TableCell>
              <Input
                name="expiryDate"
                value={doc.expiry_name}
                onChange={(e) => handleInputChange(e, index, department)}
              />
            </TableCell>
            <TableCell>
              <Input
                name="validityDays"
                value={doc.validity_days}
                onChange={(e) => handleInputChange(e, index, department)}
              />
            </TableCell>
            <TableCell>
              <Input
                name="reminderDays"
                value={doc.reminder_days}
                onChange={(e) => handleInputChange(e, index, department)}
              />
            </TableCell>
            <TableCell>
              <Button onClick={() => handleSave(doc, department)}>Save</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className=" w-full p-4">
      <h1 className="text-3xl font-bold ">Settings</h1>

      <Tabs defaultValue="Notifications" className="w-full">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="language">Language</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold">Notification Settings</h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
                <Label htmlFor="notifications">Enable notifications</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold">Appearance Settings</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="darkMode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
                <Label htmlFor="darkMode">Dark Mode</Label>
              </div>
              <div className="space-y-2">
                <Label>Theme Color</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Slider
                  defaultValue={[16]}
                  max={24}
                  min={12}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold">Language Settings</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Select Language</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Tabs defaultValue="company-docs" className="w-full">
            <TabsList>
              <TabsTrigger value="company-docs">Companys Documents</TabsTrigger>
              <TabsTrigger value="directors-docs">Directors Documents</TabsTrigger>
              <TabsTrigger value="suppliers-docs">Suppliers Documents</TabsTrigger>
              <TabsTrigger value="banks-docs">Banks Documents</TabsTrigger>
              <TabsTrigger value="employees-docs">Employees Documents</TabsTrigger>
              <TabsTrigger value="insurance-docs">Insurance Policy Documents</TabsTrigger>
              <TabsTrigger value="deposits-docs">Deposits Documents</TabsTrigger>
              <TabsTrigger value="fixed-assets-docs">Fixed Assets Register</TabsTrigger>
            </TabsList>

            <TabsContent value="company-docs">
              <Tabs defaultValue="kra-docs" className="w-full">
                <TabsList>
                  <TabsTrigger value="kra-docs">KRA Documents</TabsTrigger>
                  <TabsTrigger value="sheria-docs">Sheria Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="kra-docs">
                  <Card>
                    <CardHeader>
                      <h2 className="text-2xl font-semibold">KRA Documents</h2>
                    </CardHeader>
                    <CardContent>
                      {renderDocumentTable(kraDocuments, 'KRA')}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sheria-docs">
                  <Card>
                    <CardHeader>
                      <h2 className="text-2xl font-semibold">Sheria Documents</h2>
                    </CardHeader>
                    <CardContent>
                      {renderDocumentTable(sheriaDocuments, 'Sheria House')}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="suppliers-docs">
              <Tabs defaultValue="monthly-service-vendors" className="w-full">
                <TabsList>
                  <TabsTrigger value="monthly-service-vendors">Monthly Service Vendors - Documents</TabsTrigger>
                  <TabsTrigger value="trading-suppliers">Trading Suppliers - Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="monthly-service-vendors">
                  <Card>
                    <CardHeader>
                      <h2 className="text-2xl font-semibold">Monthly Service Vendors - Documents</h2>
                    </CardHeader>
                    <CardContent>
                      {/* Add content related to Monthly Service Vendors - Documents here */}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="trading-suppliers">
                  <Card>
                    <CardHeader>
                      <h2 className="text-2xl font-semibold">Trading Suppliers - Documents</h2>
                    </CardHeader>
                    <CardContent>
                      {/* Add content related to Trading Suppliers - Documents here */}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="fixed-assets-docs">
              <Tabs defaultValue="computer-equipments" className="w-full">
                <TabsList>
                  <TabsTrigger value="computer-equipments">Computer & Equipments</TabsTrigger>
                  <TabsTrigger value="furniture-fittings">Furniture Fitting & Equip 12.5%</TabsTrigger>
                  <TabsTrigger value="land-building">Land & Building</TabsTrigger>
                  <TabsTrigger value="plant-equipment">Plant & Equipment - 12.5%</TabsTrigger>
                  <TabsTrigger value="motor-vehicles">Motor Vehicles - 25%</TabsTrigger>
                </TabsList>
                <TabsContent value="computer-equipments">
                  <Card>
                    <CardHeader>
                      <h2 className="text-2xl font-semibold">Computer & Equipments</h2>
                    </CardHeader>
                    <CardContent>
                      {/* Add content related to Computer & Equipments here */}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="furniture-fittings">
                  <Card>
                    <CardHeader>
                      <h2 className="text-2xl font-semibold">Furniture Fitting & Equip 12.5%</h2>
                    </CardHeader>
                    <CardContent>
                      {/* Add content related to Furniture Fitting & Equip 12.5% here */}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="land-building">
                  <Card>
                    <CardHeader>
                      <h2 className="text-2xl font-semibold">Land & Building</h2>
                    </CardHeader>
                    <CardContent>
                      {/* Add content related to Land & Building here */}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="plant-equipment">
                  <Card>
                    <CardHeader>
                      <h2 className="text-2xl font-semibold">Plant & Equipment - 12.5%</h2>
                    </CardHeader>
                    <CardContent>
                      {/* Add content related to Plant & Equipment - 12.5% here */}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="motor-vehicles">
                  <Card>
                    <CardHeader>
                      <h2 className="text-2xl font-semibold">Motor Vehicles - 25%</h2>
                    </CardHeader>
                    <CardContent>
                      {/* Add content related to Motor Vehicles - 25% here */}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

          </Tabs>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default SettingsPage;
