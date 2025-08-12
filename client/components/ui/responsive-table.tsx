"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Loader2 } from "lucide-react"

interface Column<T> {
  header: string
  accessorKey: keyof T
  cell?: (item: T) => React.ReactNode
  className?: string
  hiddenOnMobile?: boolean
  cardLabel?: string // Custom label for card view
}

interface ActionItem<T> {
  label: string
  onClick?: (item: T) => void
  href?: string | ((item: T) => string)
  icon?: React.ComponentType<{ className?: string }>
  disabled?: (item: T) => boolean
  hidden?: (item: T) => boolean
  variant?: "default" | "destructive"
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  actions?: ActionItem<T>[]
  className?: string
  cardClassName?: string
  onRowClick?: (item: T) => void
  keyExtractor?: (item: T) => string
  loading?: boolean
  emptyMessage?: string
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }
}

export function ResponsiveTable<T>({ 
  data, 
  columns, 
  actions = [],
  className, 
  cardClassName,
  onRowClick, 
  keyExtractor,
  loading = false,
  emptyMessage = "No items found",
  pagination 
}: ResponsiveTableProps<T>) {
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show empty state
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // For desktop: Regular table
  const DesktopTable = (
    <div className={cn("hidden rounded-md border md:block overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={String(column.accessorKey)} 
                className={cn(
                  column.className,
                  column.hiddenOnMobile && "hidden md:table-cell"
                )}
              >
                {column.header}
              </TableHead>
            ))}
            {actions.length > 0 && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={keyExtractor ? keyExtractor(item) : index}
              className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((column) => (
                <TableCell 
                  key={String(column.accessorKey)} 
                  className={cn(
                    column.className,
                    column.hiddenOnMobile && "hidden md:table-cell"
                  )}
                >
                  {column.cell ? column.cell(item) : String(item[column.accessorKey] || "")}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell className="text-right">
                  {actions.length === 1 ? (
                    // Single action - show as button
                    (() => {
                      const action = actions[0];
                      if (action.hidden?.(item)) return null;
                      
                      const Icon = action.icon;
                      const isDisabled = action.disabled?.(item) || false;
                      
                      if (action.href) {
                        const href = typeof action.href === 'function' ? action.href(item) : action.href;
                        return (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            disabled={isDisabled}
                          >
                            <a href={href}>
                              {Icon && <Icon className="mr-2 h-4 w-4" />}
                              {action.label}
                            </a>
                          </Button>
                        );
                      }
                      
                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => action.onClick?.(item)}
                          disabled={isDisabled}
                        >
                          {Icon && <Icon className="mr-2 h-4 w-4" />}
                          {action.label}
                        </Button>
                      );
                    })()
                  ) : (
                    // Multiple actions - show as dropdown
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions
                          .filter(action => !action.hidden?.(item))
                          .map((action, actionIndex) => {
                            const Icon = action.icon;
                            const isDisabled = action.disabled?.(item) || false;
                            
                            if (action.href) {
                              const href = typeof action.href === 'function' ? action.href(item) : action.href;
                              return (
                                <DropdownMenuItem key={actionIndex} asChild disabled={isDisabled}>
                                  <a href={href}>
                                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                                    {action.label}
                                  </a>
                                </DropdownMenuItem>
                              );
                            }
                            
                            return (
                              <DropdownMenuItem 
                                key={actionIndex}
                                onClick={() => action.onClick?.(item)}
                                disabled={isDisabled}
                                className={action.variant === "destructive" ? "text-destructive" : ""}
                              >
                                {Icon && <Icon className="mr-2 h-4 w-4" />}
                                {action.label}
                              </DropdownMenuItem>
                            );
                          })
                        }
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  // For mobile: Card-based layout
  const MobileTable = (
    <div className={cn("space-y-4 md:hidden", className)}>
      {data.map((item, index) => (
        <Card
          key={keyExtractor ? keyExtractor(item) : index}
          className={cn(
            "overflow-hidden",
            onRowClick && "cursor-pointer hover:bg-muted/50",
            cardClassName
          )}
          onClick={onRowClick ? () => onRowClick(item) : undefined}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Main visible columns */}
              {columns
                .filter(column => !column.hiddenOnMobile)
                .map((column) => (
                  <div 
                    key={String(column.accessorKey)} 
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {column.cardLabel || column.header}:
                    </span>
                    <div className="text-sm font-medium">
                      {column.cell ? column.cell(item) : String(item[column.accessorKey] || "")}
                    </div>
                  </div>
                ))
              }
              
              {/* Hidden columns in condensed format */}
              {columns.some(column => column.hiddenOnMobile) && (
                <div className="pt-2 border-t border-muted">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {columns
                      .filter(column => column.hiddenOnMobile)
                      .map((column) => (
                        <div key={String(column.accessorKey)} className="flex flex-col">
                          <span className="text-muted-foreground">
                            {column.cardLabel || column.header}
                          </span>
                          <span className="font-medium">
                            {column.cell ? column.cell(item) : String(item[column.accessorKey] || "")}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Actions for mobile */}
              {actions.length > 0 && (
                <div className="pt-3 border-t border-muted">
                  <div className="flex flex-wrap gap-2">
                    {actions
                      .filter(action => !action.hidden?.(item))
                      .map((action, actionIndex) => {
                        const Icon = action.icon;
                        const isDisabled = action.disabled?.(item) || false;
                        
                        if (action.href) {
                          const href = typeof action.href === 'function' ? action.href(item) : action.href;
                          return (
                            <Button
                              key={actionIndex}
                              asChild
                              variant="outline"
                              size="sm"
                              disabled={isDisabled}
                              className="flex-1"
                            >
                              <a href={href}>
                                {Icon && <Icon className="mr-2 h-4 w-4" />}
                                {action.label}
                              </a>
                            </Button>
                          );
                        }
                        
                        return (
                          <Button
                            key={actionIndex}
                            variant="outline"
                            size="sm"
                            onClick={() => action.onClick?.(item)}
                            disabled={isDisabled}
                            className="flex-1"
                          >
                            {Icon && <Icon className="mr-2 h-4 w-4" />}
                            {action.label}
                          </Button>
                        );
                      })
                    }
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Pagination controls
  const PaginationControls = pagination && (
    <div className="flex items-center justify-end space-x-2 p-4 border-t mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
        disabled={pagination.currentPage <= 1}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {pagination.currentPage} of {pagination.totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
        disabled={pagination.currentPage >= pagination.totalPages}
      >
        Next
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      {DesktopTable}
      {MobileTable}
      {PaginationControls}
    </div>
  )
}
