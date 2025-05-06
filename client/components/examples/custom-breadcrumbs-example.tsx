import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export function CustomBreadcrumbsExample() {
  // Example of manually defining breadcrumb items
  const customItems = [
    { href: "/products", label: "Products", isCurrent: false },
    { href: "/products/categories", label: "Categories", isCurrent: false },
    { href: "/products/categories/electronics", label: "Electronics", isCurrent: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Default Breadcrumbs (Auto-generated)</h2>
        <Breadcrumbs />
      </div>

      <div>
        <h2 className="text-lg font-semibold">Custom Breadcrumbs (Manually defined)</h2>
        <Breadcrumbs items={customItems} homeHref="/dashboard" homeLabel="Dashboard" />
      </div>

      <div>
        <h2 className="text-lg font-semibold">Styled Breadcrumbs</h2>
        <Breadcrumbs
          className="bg-muted p-2 rounded-md"
          separator={<span className="mx-1 text-muted-foreground">/</span>}
          showHomeIcon={false}
        />
      </div>
    </div>
  )
}
