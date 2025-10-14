import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton for stat cards (Dashboard)
export function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

// Skeleton for product/item cards
export function ProductCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for table rows
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

// Skeleton for list items
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 border-b">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

// Skeleton for forms
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// Loading state component
export function LoadingSkeleton({ 
  type = 'card', 
  count = 3 
}: { 
  type?: 'card' | 'stat' | 'table' | 'list' | 'form'; 
  count?: number 
}) {
  const skeletonMap = {
    stat: StatCardSkeleton,
    card: ProductCardSkeleton,
    table: TableRowSkeleton,
    list: ListItemSkeleton,
    form: FormSkeleton,
  };

  const SkeletonComponent = skeletonMap[type];

  if (type === 'stat' || type === 'card') {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonComponent key={i} />
        ))}
      </div>
    );
  }

  if (type === 'list' || type === 'table') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonComponent key={i} />
        ))}
      </div>
    );
  }

  return <SkeletonComponent />;
}
