import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-full max-w-[250px]" />
        <Skeleton className="h-8 w-8" />
      </div>
      <div className="rounded-md border">
        <div className="border-b p-4">
          <div className="grid grid-cols-4 gap-4 md:grid-cols-6">
            {Array(columns)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
          </div>
        </div>
        <div className="p-4">
          {Array(rows)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 py-3 md:grid-cols-6">
                {Array(columns)
                  .fill(0)
                  .map((_, j) => (
                    <Skeleton key={j} className="h-6 w-full" />
                  ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
            <CardFooter className="p-4">
              <Skeleton className="h-9 w-full max-w-[120px]" />
            </CardFooter>
          </Card>
        ))}
    </div>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array(fields)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      <Skeleton className="h-10 w-full max-w-[120px]" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-4">
                <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="mt-2 h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="p-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="p-4">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader className="p-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
