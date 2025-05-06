"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"

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
}

export function ResponsiveTable<T>({ data, columns, className, onRowClick }: ResponsiveTableProps<T>) {
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
    </div>
  )

  return (
    <>
      {DesktopTable}
      {MobileTable}
    </>
  )
}
