/**
 * Sidebar component - RFP list navigation
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { RfpWithRelations, RfpStatus } from '@/types';

interface SidebarProps {
  rfps: RfpWithRelations[];
  selectedRfpId: number | null;
  onSelectRfp: (rfpId: number) => void;
  onNewRfp: () => void;
}

/**
 * Get badge variant color based on RFP status
 */
function getStatusVariant(status: RfpStatus): string {
  switch (status) {
    case 'Active':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'Won':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'Lost':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    case 'NoBid':
    case 'Archived':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    default:
      return 'secondary';
  }
}

export default function Sidebar({
  rfps,
  selectedRfpId,
  onSelectRfp,
  onNewRfp,
}: SidebarProps) {
  return (
    <div className="w-72 flex flex-col h-screen border-r bg-white">
      {/* Header */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3">RFPs</h2>
        <Button onClick={onNewRfp} className="w-full">
          New RFP
        </Button>
      </div>

      <Separator />

      {/* RFP List */}
      <ScrollArea className="flex-1">
        {rfps.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No RFPs yet. Create your first one!
          </div>
        ) : (
          <div className="p-2">
            {rfps.map((rfp) => (
              <button
                key={rfp.id}
                onClick={() => onSelectRfp(rfp.id)}
                aria-current={selectedRfpId === rfp.id ? 'true' : undefined}
                className={`
                  w-full text-left p-3 rounded-lg mb-2 transition-colors
                  ${
                    selectedRfpId === rfp.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-sm line-clamp-2">{rfp.name}</h3>
                </div>

                <div className="text-xs text-gray-600 mb-2">{rfp.agency}</div>

                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className={getStatusVariant(rfp.status)}>
                    {rfp.status}
                  </Badge>

                  {rfp.deadlines.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {rfp.deadlines.length} {rfp.deadlines.length === 1 ? 'deadline' : 'deadlines'}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
