'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

interface MobileTableProps {
  data: Array<Record<string, ReactNode>>
  headers: Array<{ key: string; label: string; mobileLabel?: string }>
  className?: string
  emptyMessage?: string
  onRowClick?: (row: Record<string, ReactNode>) => void
}

/**
 * Responsive table component that shows cards on mobile and table on desktop
 */
export function MobileTable({ 
  data, 
  headers, 
  className = '', 
  emptyMessage = 'No data available',
  onRowClick
}: MobileTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile View: Cards */}
      <div className="block sm:hidden space-y-3">
        {data.map((row, index) => (
          <Card 
            key={index}
            className={`p-4 ${onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            onClick={() => onRowClick?.(row)}
          >
            <div className="space-y-2">
              {headers.map((header) => {
                const value = row[header.key]
                if (value === null || value === undefined || value === '') return null
                
                return (
                  <div key={header.key} className="flex justify-between items-start">
                    <span className="text-xs font-medium text-gray-500 capitalize">
                      {header.mobileLabel || header.label}:
                    </span>
                    <span className="text-sm text-gray-900 text-right flex-1 ml-4">
                      {value}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr
                key={index}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
                onClick={() => onRowClick?.(row)}
              >
                {headers.map((header) => (
                  <td
                    key={header.key}
                    className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                  >
                    {row[header.key] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

