import { ReactNode } from "react"

interface TableProps {
  children: ReactNode
  className?: string
}

interface TableHeaderProps {
  children: ReactNode
  className?: string
}

interface TableBodyProps {
  children: ReactNode
  className?: string
}

interface TableRowProps {
  children: ReactNode
  className?: string
}

interface TableCellProps {
  children: ReactNode
  className?: string
  colSpan?: number
  isHeader?: boolean
}

function Table({ children, className }: TableProps) {
  return <table className={`min-w-full ${className}`}>{children}</table>
}

function TableHeader({ children, className }: TableHeaderProps) {
  return <thead className={className}>{children}</thead>
}

function TableBody({ children, className }: TableBodyProps) {
  return <tbody className={className}>{children}</tbody>
}

function TableRow({ children, className }: TableRowProps) {
  return <tr className={className}>{children}</tr>
}

function TableCell({
  children,
  className,
  colSpan,
  isHeader = false,
}: TableCellProps) {
  const CellTag = isHeader ? "th" : "td"
  return <CellTag className={className} colSpan={colSpan}>{children}</CellTag>
}

export { Table, TableBody, TableCell, TableHeader, TableRow }
export { default as DataTable } from "./DataTable"
export type { Column, FilterConfig } from "./DataTable"
