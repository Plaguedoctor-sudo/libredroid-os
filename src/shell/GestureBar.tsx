import React from 'react';

export function GestureBar({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-lrd-gesture className={`lrd-gesture-bar ${className}`} {...props}>
      {children}
    </div>
  );
}
