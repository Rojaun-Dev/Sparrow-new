'use client';

import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UserProfile() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading user profile...</div>;
  }

  if (!user) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <Avatar className="w-20 h-20 mx-auto mb-4">
          <AvatarImage src={user.picture} alt={user.name} />
          <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Email:</span> {user.email}
          </div>
          {user.sub && (
            <div>
              <span className="font-medium">Auth0 ID:</span> {user.sub}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 