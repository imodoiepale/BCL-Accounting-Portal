// @ts-nocheck
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
// import { usePathname } from "next/navigation";

interface OnboardingPageProps {
  onComplete: (data: any) => void;
}


export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { signUp, setActive } = useSignUp();
  const router = useRouter();
  // const pathname = usePathname();

  // Form states
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyUsername, setNewCompanyUsername] = useState("");
  const [newCompanyPassword, setNewCompanyPassword] = useState("");

  const resetInputs = () => {
    setNewCompanyName("");
    setNewCompanyUsername("");
    setNewCompanyPassword("");
    setErrorMessage("");
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (!signUp) {
        throw new Error("Sign up is not initialized");
      }

      // Validation
      if (!newCompanyName || !newCompanyUsername || !newCompanyPassword) {
        setErrorMessage("All fields are required");
        setLoading(false);
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(newCompanyUsername)) {
        setErrorMessage("Username can only contain letters, numbers, and underscores");
        setLoading(false);
        return;
      }

      if (newCompanyPassword.length < 8) {
        setErrorMessage("Password must be at least 8 characters long");
        setLoading(false);
        return;
      }

      try {
        // First create the basic sign up
        await signUp.create({
          username: newCompanyUsername.trim(),
          password: newCompanyPassword,
          firstName: newCompanyName.trim(),
        });

        // Update metadata through API
        const response = await fetch("/api/create-users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newCompanyName.trim(),
            username: newCompanyUsername.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to update company metadata");
        }

        // Success handling
        if (data.id) {
          console.log('Step 1 completed: Company created successfully');
          console.log('Company details:', {
            name: newCompanyName,
            username: newCompanyUsername,
            userId: data.id
          });
          
          toast.success("Company account created successfully!");
          resetInputs();
          setIsOpen(false);
          
          console.log('Transitioning to Step 2: Upload');
          onComplete({ 
            name: newCompanyName, 
            username: newCompanyUsername,
            password: newCompanyPassword 
          });
        
        }
      } catch (clerkError: any) {
        console.error("Clerk Sign Up Error:", clerkError);
        const errorMessage = clerkError.errors?.[0]?.message || "Failed to create account";
        setErrorMessage(errorMessage);
        toast.error(errorMessage);
      }

    } catch (error: any) {
      console.error("Creation Error:", error);
      const errorMessage = error.message || "An unexpected error occurred";
      setErrorMessage(errorMessage);
      toast.error(errorMessage);
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Company Account</DialogTitle>
          </DialogHeader>
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
            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <span>Creating...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}