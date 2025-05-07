'use client';

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export function LoginButton() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Button variant="outline" disabled>Loading...</Button>;
  }

  if (user) {
    return (
      <Link href="/auth/logout" passHref>
        <Button variant="outline">Logout</Button>
      </Link>
    );
  }

  return (
    <Link href="/auth/login" passHref>
      <Button>Login</Button>
    </Link>
  );
} 