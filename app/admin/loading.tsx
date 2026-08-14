export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-3xl bg-surface border border-outline/10" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-80 rounded-3xl bg-surface border border-outline/10" />
        <div className="h-80 rounded-3xl bg-surface border border-outline/10" />
      </div>
      <div className="h-64 rounded-3xl bg-surface border border-outline/10" />
    </div>
  );
}
