interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
      <div>
        <h1 className="text-title text-black">{title}</h1>
        {description && <p className="mt-1 text-small text-gray-500">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
