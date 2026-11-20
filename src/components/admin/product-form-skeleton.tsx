import { Skeleton } from "@astryxdesign/core/Skeleton";

/**
 * Placeholder de la ficha de producto. Se usa tanto para editar como para crear.
 */
export function ProductFormSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Cargando producto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton width={112} height={12} radius={2} index={0} />
          <Skeleton width={240} height={38} radius={3} index={1} />
          <Skeleton width={180} height={12} radius={2} index={2} />
        </div>
        <div className="flex gap-2">
          <Skeleton width={96} height={42} radius={3} index={3} />
          <Skeleton width={148} height={42} radius={3} index={4} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-white p-5">
            <Skeleton width={140} height={16} radius={2} index={5} />
            <div className="mt-5 space-y-4">
              <Skeleton width="100%" height={42} radius={3} index={6} />
              <Skeleton width="100%" height={120} radius={3} index={7} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton width="100%" height={42} radius={3} index={8} />
                <Skeleton width="100%" height={42} radius={3} index={9} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <Skeleton width={120} height={16} radius={2} index={10} />
            <div className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} width="100%" height={96} radius={3} index={index + 11} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-white p-5">
            <Skeleton width={110} height={16} radius={2} index={16} />
            <div className="mt-5 space-y-3">
              <Skeleton width="100%" height={42} radius={3} index={17} />
              <Skeleton width="100%" height={42} radius={3} index={18} />
            </div>
          </div>
          <Skeleton width="100%" height={220} radius={4} index={19} />
        </div>
      </div>
    </div>
  );
}
