"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Get custom message from query parameters or use default
  const message = searchParams.get("message") || 
                 "You don't have permission to access this page";
  
  const isLoggedIn = !!user;

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-red-100 p-3">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
            Access Denied
          </h1>
          
          <div className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 p-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">{message}</p>
          </div>
          
          <p className="mb-6 text-sm text-gray-600">
            {isLoggedIn 
              ? "Your current user role doesn't have permission to access this area."
              : "You need to log in to access this page."}
          </p>
          
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleGoBack}
            >
              Go Back
            </Button>
            
            {isLoggedIn ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            ) : (
              <Button 
                className="w-full"
                onClick={handleGoHome}
              >
                Log In
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 