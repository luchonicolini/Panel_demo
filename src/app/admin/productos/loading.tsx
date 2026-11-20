import { Skeleton } from "@astryxdesign/core/Skeleton";

/**
 * Carga del listado de productos con el ritmo visual del panel.
 * Astryx aporta el pulso y el radius del sistema; el layout sigue siendo Nicolini.
 */
export default function ProductsLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Cargando productos">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton width={92} height={12} radius={2} index={0} />
          <Skeleton width={260} height={38} radius={3} index={1} />
        </div>
        <Skeleton width={168} height={44} radius={3} index={2} />
      </div>

      <div className="rounded-2xl border border-border bg-white p-2">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} width={104} height={36} radius={3} index={index} />
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="space-y-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton width={44} height={44} radius={3} index={index} />
                <div className="flex-1 space-y-2">
                  <Skeleton width="45%" height={14} radius={2} index={index + 1} />
                  <Skeleton width="28%" height={11} radius={2} index={index + 2} />
                </div>
                <Skeleton width={88} height={28} radius="rounded" index={index + 3} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <Skeleton width="100%" height={220} radius={4} index={4} />
          <Skeleton width="100%" height={300} radius={4} index={5} />
        </div>
      </div>
    </div>
  );
}
