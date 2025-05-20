"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Column<T> {
  header: string
  accessorKey: keyof T
  cell?: (item: T) => React.ReactNode
  className?: string
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
  onRowClick?: (item: T) => void
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }
}

export function ResponsiveTable<T>({ data, columns, className, onRowClick, pagination }: ResponsiveTableProps<T>) {
  // For desktop: Regular table
  const DesktopTable = (
    <div className={cn("hidden rounded-md border md:block", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.accessorKey)} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={index}
              className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
              onClick={() => onRowClick && onRowClick(item)}
            >
              {columns.map((column) => (
                <TableCell key={String(column.accessorKey)} className={column.className}>
                  {column.cell ? column.cell(item) : String(item[column.accessorKey] || "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pagination && (
        <div className="flex items-center justify-end space-x-2 p-4 border-t">
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
      )}
    </div>
  )

  // For mobile: Card-based layout
  const MobileTable = (
    <div className={cn("space-y-4 md:hidden", className)}>
      {data.map((item, index) => (
        <Card
          key={index}
          className={cn("overflow-hidden", onRowClick && "cursor-pointer hover:bg-muted/50")}
          onClick={() => onRowClick && onRowClick(item)}
        >
          <div className="divide-y">
            {columns.map((column) => (
              <div key={String(column.accessorKey)} className="flex items-start justify-between p-3">
                <span className="font-medium text-sm text-muted-foreground">{column.header}</span>
                <div className="max-w-[60%] text-right">
                  {column.cell ? column.cell(item) : String(item[column.accessorKey] || "")}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
      {pagination && (
        <div className="flex items-center justify-between p-4">
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
      )}
    </div>
  )

  return (
    <>
      {DesktopTable}
      {MobileTable}
    </>
  )
}
