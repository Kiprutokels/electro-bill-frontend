import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeIndicatorProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeIndicator({ showLabel = false, className = '' }: ThemeIndicatorProps) {
  const { theme, resolvedTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'system':
        return `System (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`;
      default:
        return 'Light Mode';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getIcon()}
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {getLabel()}
        </span>
      )}
    </div>
  );
}
