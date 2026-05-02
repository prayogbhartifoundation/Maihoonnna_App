import React, { useState } from 'react';
import { cn } from '../ui/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogHeader,
} from '../ui/dialog';

export type EntityType = 
  | 'operations_manager' 
  | 'field_manager' 
  | 'care_companion' 
  | 'subscriber' 
  | 'beneficiary'
  | 'team';

interface EntityAvatarProps {
  name?: string;
  photoUrl?: string | null;
  type: EntityType;
  className?: string;
  style?: React.CSSProperties;
}

export function EntityAvatar({ name, photoUrl, type, className, style }: EntityAvatarProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const getBackgroundColor = (type: EntityType) => {
    switch (type) {
      case 'operations_manager': return 'bg-[#1D4ED8] text-white';
      case 'field_manager': return 'bg-[#1F8A3E] text-white';
      case 'care_companion': return 'bg-[#FF7A00] text-white';
      case 'subscriber': return 'bg-[#6B7280] text-white';
      case 'beneficiary': return 'bg-[#FFF5EE] text-[#FF7A00]';
      case 'team': return 'bg-[#F4EAE3] text-[#FF7A00]';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const initials = name 
    ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : '?';

  return (
    <>
      <div 
        onClick={() => photoUrl && setIsViewerOpen(true)}
        className={cn(
          "rounded-2xl flex items-center justify-center font-bold overflow-hidden shrink-0",
          photoUrl ? "cursor-pointer" : "cursor-default",
          getBackgroundColor(type),
          className
        )}
        style={style}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={name || 'Avatar'} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{name || 'Avatar'}</DialogTitle>
          </DialogHeader>
          {photoUrl && (
            <div className="relative flex items-center justify-center min-h-[300px]">
              <img 
                src={photoUrl} 
                alt={name || 'Avatar'} 
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
