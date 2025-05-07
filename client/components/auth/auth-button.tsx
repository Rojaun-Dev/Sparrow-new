'use client';

import { Button } from "@/components/ui/button";
import { useAuthContext } from "./auth-provider";
import { LogIn, LogOut, UserPlus } from "lucide-react";

type AuthButtonProps = {
  type: 'login' | 'logout' | 'signup';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
};

export function AuthButton({ 
  type, 
  variant = 'default',
  size = 'default',
  showIcon = true,
  className 
}: AuthButtonProps) {
  const { login, logout, signup, isAuthenticated, isLoading } = useAuthContext();

  // Determine icon and text based on type
  const getIconAndText = () => {
    switch (type) {
      case 'login':
        return { 
          icon: <LogIn className="h-4 w-4 mr-2" />, 
          text: 'Sign In',
          action: login
        };
      case 'logout':
        return { 
          icon: <LogOut className="h-4 w-4 mr-2" />, 
          text: 'Sign Out',
          action: logout
        };
      case 'signup':
        return { 
          icon: <UserPlus className="h-4 w-4 mr-2" />, 
          text: 'Sign Up',
          action: signup
        };
    }
  };

  const { icon, text, action } = getIconAndText();

  if (isLoading) {
    return <Button variant={variant} size={size} disabled className={className}>Loading...</Button>;
  }

  // Only show login/signup if not authenticated, and logout if authenticated
  if ((type === 'login' || type === 'signup') && isAuthenticated) {
    return null;
  }

  if (type === 'logout' && !isAuthenticated) {
    return null;
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={action}
      className={className}
    >
      {showIcon && icon}
      {text}
    </Button>
  );
} 