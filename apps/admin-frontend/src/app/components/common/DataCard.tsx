/**
 * Reusable Data Card Component
 * Used for displaying entity cards across the application
 */

import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../ui/utils';

interface DataCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  avatar?: ReactNode;
  onClick?: () => void;
}

export function DataCard({ title, description, children, className, headerAction, avatar, onClick }: DataCardProps) {
  return (
    <Card 
      className={cn('bg-card border-border', onClick && 'cursor-pointer hover:shadow-md transition-shadow duration-200', className)}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-center gap-4">
          {avatar && <div>{avatar}</div>}
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        {headerAction && <div>{headerAction}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
