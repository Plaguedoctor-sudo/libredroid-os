import React from 'react';

export function Dock({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-lrd-dock className={`lrd-dock ${className}`} {...props}>
      {children}
    </div>
  );
}
