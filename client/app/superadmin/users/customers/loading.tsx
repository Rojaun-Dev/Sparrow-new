import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-10 w-[300px] mb-2" />
        <Skeleton className="h-5 w-[450px]" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <Skeleton className="h-6 w-[150px] mb-2" />
              <Skeleton className="h-4 w-[220px]" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Skeleton className="h-10 w-[260px]" />
              <Skeleton className="h-10 w-[200px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-5 w-[100px]" />
              ))}
            </div>

            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-5 w-[150px]" />
                </div>
                <Skeleton className="h-5 w-[200px]" />
                <Skeleton className="h-5 w-[100px]" />
                <Skeleton className="h-6 w-[80px] rounded-full" />
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}

            <div className="flex items-center justify-between pt-4">
              <Skeleton className="h-5 w-[150px]" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-[80px]" />
                <Skeleton className="h-9 w-[80px]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 