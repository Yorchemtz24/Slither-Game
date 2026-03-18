'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with canvas
const SlitherGame = dynamic(
  () => import('@/components/game/SlitherGame').then(mod => mod.SlitherGame),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-lg">Cargando Slither.io...</p>
        </div>
      </div>
    )
  }
);

export default function Home() {
  return <SlitherGame />;
}
