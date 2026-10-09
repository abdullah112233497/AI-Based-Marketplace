import React from 'react';
import { CategorySpecSchema } from '@tech-marketplace/shared';

interface SpecTableProps {
  schema?: CategorySpecSchema;
  specs: Record<string, any>;
  className?: string;
}

export function SpecTable({ schema, specs, className = '' }: SpecTableProps) {
  if (!specs || Object.keys(specs).length === 0) {
    return (
      <div className="text-xs text-ink-muted italic py-4">
        No technical specifications listed for this product.
      </div>
    );
  }

  // If we have a category schema, map the defined fields
  const rows = schema?.fields
    ? schema.fields
        .filter(field => specs[field.key] !== undefined && specs[field.key] !== null)
        .map(field => ({
          key: field.key,
          label: field.label,
          value: specs[field.key],
          unit: field.unit
        }))
    : Object.entries(specs).map(([k, v]) => ({
        key: k,
        label: k.replace(/_/g, ' ').toUpperCase(),
        value: v,
        unit: ''
      }));

  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-white shadow-xs ${className}`}>
      <table className="min-w-full divide-y divide-border text-xs text-left">
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, idx) => (
            <tr key={row.key} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
              <td className="px-4 py-3 font-semibold text-slate-700 w-1/3 border-r border-slate-100">
                {row.label}
              </td>
              <td className="px-4 py-3 text-ink font-medium">
                {typeof row.value === 'boolean'
                  ? row.value ? 'Yes' : 'No'
                  : `${row.value}${row.unit ? ` ${row.unit}` : ''}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
