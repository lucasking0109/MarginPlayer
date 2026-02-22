interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  color?: string;
}

export function StatCard({ label, value, subtext, color }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className="text-2xl font-bold"
        style={{ color: color || "#e0e0e0" }}
      >
        {value}
      </p>
      {subtext && (
        <p className="text-xs text-gray-500 mt-1">{subtext}</p>
      )}
    </div>
  );
}
