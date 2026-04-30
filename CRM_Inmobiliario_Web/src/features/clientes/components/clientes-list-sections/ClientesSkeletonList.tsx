const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-pulse">
    <div className="flex justify-between items-start mb-5">
      <div className="h-12 w-12 bg-slate-100 rounded-xl"></div>
      <div className="h-6 w-24 bg-slate-50 rounded-full"></div>
    </div>
    <div className="mb-6 space-y-2">
      <div className="h-5 w-3/4 bg-slate-100 rounded-md"></div>
      <div className="h-3 w-1/2 bg-slate-50 rounded-md"></div>
    </div>
    <div className="space-y-3 pt-5 border-t border-slate-50">
      <div className="h-4 w-full bg-slate-50 rounded-md"></div>
      <div className="h-4 w-2/3 bg-slate-50 rounded-md"></div>
    </div>
  </div>
);

export const ClientesSkeletonList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
    </div>
  );
};
