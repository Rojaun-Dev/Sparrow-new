import { auth0 } from "@/lib/auth0";
import { UserProfile } from "@/components/auth/user-profile";
import { redirect } from "next/navigation";

export async function ServerProfile() {
  const session = await auth0.getSession();

  if (!session) {
    // Redirect to login if not authenticated
    redirect('/auth/login');
    return null;
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Profile</h1>
        <p className="text-muted-foreground">
          View and manage your account information
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="bg-card rounded-lg p-6 border shadow-sm">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                <img 
                  src={session.user.picture || "https://via.placeholder.com/96"} 
                  alt={session.user.name || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-xl font-semibold">{session.user.name}</h2>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <div className="bg-card rounded-lg p-6 border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Account Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="text-sm">{session.user.sub}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{session.user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Verified</p>
                <p className="text-sm">{session.user.email_verified ? "Yes" : "No"}</p>
              </div>
              {session.user.updated_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-sm">{new Date(session.user.updated_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 