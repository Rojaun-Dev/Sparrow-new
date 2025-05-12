'use client';

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LoginButton() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <Button variant="outline" disabled>Loading...</Button>;
  }

  if (isAuthenticated) {
    return (
      <Button 
        variant="outline" 
        onClick={async () => {
          await logout();
          router.push('/');
        }}
      >
        Logout
      </Button>
    );
  }

  return (
    <Link href="/login" passHref>
      <Button>Login</Button>
    </Link>
  );
} 