/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Plus, TreePine, Droplets, Box, Trash2, MousePointer2 } from 'lucide-react'; 

// Load Game
const VivariumGame = dynamic(() => import('../components/VivariumGame'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-slate-900 text-white flex items-center justify-center">Loading World...</div>
});

// Tipe Alat yang tersedia
export type ToolType = 'NONE' | 'SLIME' | 'TREE' | 'ROCK' | 'WATER';

export default function Page() {
  const [selectedTool, setSelectedTool] = useState<ToolType>('NONE');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans text-slate-200">
      
      {/* GAME LAYER - Kita kirim alat yang dipilih ke game */}
      <VivariumGame selectedTool={selectedTool} />

      {/* TOOLBAR (Tengah Bawah) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 p-3 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl z-50">
        
        {/* Tombol Cursor (Netral) */}
        <ToolButton 
          isActive={selectedTool === 'NONE'} 
          onClick={() => setSelectedTool('NONE')}
          icon={<MousePointer2 size={20} />}
          label="Cursor"
          color="bg-slate-600"
        />

        {/* Tombol Slime */}
        <ToolButton 
          isActive={selectedTool === 'SLIME'} 
          onClick={() => setSelectedTool('SLIME')}
          icon={<Plus size={20} />}
          label="Slime"
          color="bg-blue-500"
        />

        {/* Tombol Tree */}
        <ToolButton 
          isActive={selectedTool === 'TREE'} 
          onClick={() => setSelectedTool('TREE')}
          icon={<TreePine size={20} />}
          label="Tree"
          color="bg-emerald-500"
        />

        {/* Tombol Rock */}
        <ToolButton 
          isActive={selectedTool === 'ROCK'} 
          onClick={() => setSelectedTool('ROCK')}
          icon={<Box size={20} />}
          label="Rock"
          color="bg-gray-500"
        />

        {/* Tombol Water */}
        <ToolButton 
          isActive={selectedTool === 'WATER'} 
          onClick={() => setSelectedTool('WATER')}
          icon={<Droplets size={20} />}
          label="Water"
          color="bg-cyan-500"
        />

        <div className="w-[1px] bg-white/10 mx-1"></div>

        {/* Tombol Reset */}
        <button 
          onClick={() => window.location.reload()}
          className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-xl transition active:scale-95 group"
        >
          <div className="p-3 rounded-full bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition">
            <Trash2 size={20} />
          </div>
          <span className="text-[10px] font-bold text-red-300">Reset</span>
        </button>

      </div>

      {/* Info Panel */}
      <div className="absolute top-6 left-6 pointer-events-none">
        <h1 className="text-2xl font-black text-white tracking-tighter">VIVARIUM <span className="text-blue-500">GOD MODE</span></h1>
        <p className="text-slate-400 text-sm">Select a tool and click on map to spawn.</p>
        <div className="mt-2 text-yellow-400 text-xs bg-yellow-400/10 p-2 rounded border border-yellow-400/20 inline-block">
          Tool Active: <b>{selectedTool}</b>
        </div>
      </div>

    </div>
  );
}

// Komponen Kecil untuk Tombol biar rapi
function ToolButton({ isActive, onClick, icon, label, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition active:scale-95 ${isActive ? 'bg-white/10 ring-1 ring-white/30' : 'hover:bg-white/5'}`}
    >
      <div className={`p-3 rounded-full text-white shadow-lg transition ${isActive ? color : 'bg-slate-700 opacity-70'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>{label}</span>
    </button>
  );
}