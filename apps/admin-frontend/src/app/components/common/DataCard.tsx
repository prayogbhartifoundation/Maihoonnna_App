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
  onClick?: () => void;
}

export function DataCard({ title, description, children, className, headerAction, onClick }: DataCardProps) {
  return (
    <Card 
      className={cn('bg-card border-border', onClick && 'cursor-pointer hover:shadow-md transition-shadow duration-200', className)}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
