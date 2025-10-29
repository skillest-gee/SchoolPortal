'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface EnhancedMobileTableProps {
  data: any[]
  columns: Array<{
    key: string
    label: string
    mobileLabel?: string
    render?: (value: any, row: any) => ReactNode
    mobileRender?: (value: any, row: any) => ReactNode
    hideOnMobile?: boolean
  }>
  className?: string
  emptyMessage?: string
  onRowClick?: (row: any) => void
  selectable?: boolean
  selectedRows?: string[]
  onRowSelect?: (rowId: string, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
  getRowId?: (row: any) => string
}

/**
 * Enhanced responsive table with mobile card view and desktop table
 * Supports checkboxes, action buttons, and custom cell rendering
 */
export function EnhancedMobileTable({ 
  data, 
  columns, 
  className = '', 
  emptyMessage = 'No data available',
  onRowClick,
  selectable = false,
  selectedRows = [],
  onRowSelect,
  onSelectAll,
  getRowId = (row) => row.id
}: EnhancedMobileTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  const allSelected = data.length > 0 && selectedRows.length === data.length

  const renderCell = (column: typeof columns[0], row: any) => {
    const value = row[column.key]
    
    if (column.render) {
      return column.render(value, row)
    }
    
    return value || '-'
  }

  const renderMobileCell = (column: typeof columns[0], row: any) => {
    const value = row[column.key]
    
    if (column.mobileRender) {
      return column.mobileRender(value, row)
    }
    
    if (column.render) {
      return column.render(value, row)
    }
    
    return value || '-'
  }

  return (
    <>
      {/* Mobile View: Cards */}
      <div className="block sm:hidden space-y-3">
        {data.map((row, index) => {
          const rowId = getRowId(row)
          const isSelected = selectedRows.includes(rowId)
          const visibleColumns = columns.filter(col => !col.hideOnMobile)
          
          return (
            <Card 
              key={rowId || index}
              className={`p-4 ${onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            >
              {selectable && (
                <div className="mb-3 pb-3 border-b">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onRowSelect?.(rowId, e.target.checked)}
                    className="rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className="space-y-2">
                {visibleColumns.map((column) => {
                  const cellContent = renderMobileCell(column, row)
                  if (cellContent === null || cellContent === undefined || cellContent === '') return null
                  
                  return (
                    <div key={column.key} className="flex justify-between items-start gap-2">
                      <span className="text-xs font-medium text-gray-500 capitalize flex-shrink-0">
                        {column.mobileLabel || column.label}:
                      </span>
                      <span className="text-sm text-gray-900 text-right flex-1 ml-2 break-words">
                        {cellContent}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => {
              const rowId = getRowId(row)
              const isSelected = selectedRows.includes(rowId)
              
              return (
                <tr
                  key={rowId || index}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
                  onClick={() => !selectable && onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onRowSelect?.(rowId, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-sm text-gray-900"
                    >
                      {renderCell(column, row)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

