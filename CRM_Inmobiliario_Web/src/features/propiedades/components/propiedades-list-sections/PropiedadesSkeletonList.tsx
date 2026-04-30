const SkeletonPropertyCard = () => (
  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm animate-pulse">
    <div className="h-56 bg-slate-100 w-full"></div>
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        <div className="h-5 w-20 bg-slate-50 rounded-full"></div>
        <div className="h-5 w-16 bg-slate-50 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-6 w-3/4 bg-slate-100 rounded-md"></div>
        <div className="h-4 w-1/2 bg-slate-50 rounded-md"></div>
      </div>
      <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
        <div className="h-7 w-24 bg-slate-100 rounded-md"></div>
        <div className="h-5 w-5 bg-slate-50 rounded-full"></div>
      </div>
    </div>
  </div>
);

export const PropiedadesSkeletonList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in duration-500">
      {[1, 2, 3, 4, 5, 6].map(i => <SkeletonPropertyCard key={i} />)}
    </div>
  );
};
