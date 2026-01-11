/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Plus, TreePine, Droplets, Box, Trash2, MousePointer2, ShieldAlert, Swords } from 'lucide-react'; 
import { MinionData } from '../components/VivariumGame';

const VivariumGame = dynamic(() => import('../components/VivariumGame'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-slate-900 text-white flex items-center justify-center">Loading World...</div>
});

export type ToolType = 'NONE' | 'SLIME' | 'TREE' | 'ROCK' | 'WATER' | 'DELETE';

export default function Page() {
  const [selectedTool, setSelectedTool] = useState<ToolType>('NONE');
  const [objectSize, setObjectSize] = useState<number>(0.2); 
  const [selectedMinion, setSelectedMinion] = useState<MinionData | null>(null);
  
  const [spawnConfig, setSpawnConfig] = useState({
    atk: 10,
    def: 5,
    traits: [] as string[]
  });

  const toggleTrait = (trait: string) => {
    setSpawnConfig(prev => ({
      ...prev,
      traits: prev.traits.includes(trait) 
        ? prev.traits.filter(t => t !== trait)
        : [...prev.traits, trait]
    }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans text-slate-200 selection:bg-blue-500/30">
      
      <VivariumGame 
        selectedTool={selectedTool} 
        objectSize={objectSize} 
        spawnConfig={spawnConfig}
        onSelectMinion={setSelectedMinion}
      />

      {/* INSPECTOR */}
      {selectedMinion && (
        <div className="absolute top-6 right-6 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-right-10 z-50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {selectedMinion.gender === 'MALE' ? '♂ Boy' : '♀ Girl'}
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-400">Gen {selectedMinion.generation}</span>
              </h2>
              <div className="text-xs text-slate-400">Age: {Math.floor(selectedMinion.age)} years</div>
            </div>
            <button onClick={() => setSelectedMinion(null)} className="text-slate-500 hover:text-white"><Trash2 size={16}/></button>
          </div>

          <div className="space-y-3">
            <Bar label="HP" val={selectedMinion.stats.hp} max={selectedMinion.stats.maxHp} color="bg-red-500" />
            <Bar label="Hunger" val={selectedMinion.stats.hunger} max={100} color="bg-orange-500" />
            <Bar label="Thirst" val={selectedMinion.stats.thirst} max={100} color="bg-blue-500" />
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Stat icon={<Swords size={12}/>} label="ATK" val={selectedMinion.stats.atk} />
              <Stat icon={<ShieldAlert size={12}/>} label="DEF" val={selectedMinion.stats.def} />
            </div>

            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-slate-500 mb-1">TRAITS</p>
              <div className="flex flex-wrap gap-1">
                {selectedMinion.traits.length > 0 ? selectedMinion.traits.map(t => (
                  <span key={t} className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30">{t}</span>
                )) : <span className="text-[10px] text-slate-600">No Traits</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIG SLIME & SLIDER UKURAN */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl w-80 z-50 transition-all duration-300">
        
        {/* Slider Ukuran (Hanya muncul jika Tree/Rock/Water) */}
        {['TREE', 'ROCK', 'WATER'].includes(selectedTool) && (
          <div className="mb-4">
             <div className="flex justify-between mb-1 text-xs text-slate-400">
                <span>Object Size</span>
                <span>{objectSize}x</span>
             </div>
             <input type="range" min="0.1" max="1.5" step="0.1" value={objectSize} onChange={(e)=>setObjectSize(Number(e.target.value))} className="w-full accent-emerald-500"/>
          </div>
        )}

        {/* Config Slime (Hanya muncul jika Slime) */}
        {selectedTool === 'SLIME' && (
          <>
            <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Genetic Engineering</h3>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="text-xs block mb-1">Attack</label>
                <input type="range" min="1" max="50" value={spawnConfig.atk} onChange={(e)=>setSpawnConfig({...spawnConfig, atk: Number(e.target.value)})} className="w-full accent-red-500"/>
              </div>
              <div className="flex-1">
                <label className="text-xs block mb-1">Defense</label>
                <input type="range" min="1" max="50" value={spawnConfig.def} onChange={(e)=>setSpawnConfig({...spawnConfig, def: Number(e.target.value)})} className="w-full accent-blue-500"/>
              </div>
            </div>
            <div className="flex gap-2">
              {['Aggressive', 'Lazy', 'Lustful'].map(trait => (
                <button 
                  key={trait}
                  onClick={() => toggleTrait(trait)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg border transition ${
                    spawnConfig.traits.includes(trait) 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {trait}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50">
        <ToolBtn active={selectedTool==='NONE'} onClick={()=>setSelectedTool('NONE')} icon={<MousePointer2 size={18}/>} />
        <div className="w-px bg-white/10 mx-1"></div>
        <ToolBtn active={selectedTool==='SLIME'} onClick={()=>setSelectedTool('SLIME')} icon={<Plus size={18}/>} color="bg-indigo-500"/>
        <ToolBtn active={selectedTool==='TREE'} onClick={()=>setSelectedTool('TREE')} icon={<TreePine size={18}/>} color="bg-emerald-500"/>
        <ToolBtn active={selectedTool==='ROCK'} onClick={()=>setSelectedTool('ROCK')} icon={<Box size={18}/>} color="bg-slate-500"/>
        <ToolBtn active={selectedTool==='WATER'} onClick={()=>setSelectedTool('WATER')} icon={<Droplets size={18}/>} color="bg-cyan-500"/>
        <div className="w-px bg-white/10 mx-1"></div>
        <ToolBtn active={selectedTool==='DELETE'} onClick={()=>setSelectedTool('DELETE')} icon={<Trash2 size={18}/>} color="bg-red-500"/>
      </div>

    </div>
  );
}

// Sub-Components
function ToolBtn({ active, onClick, icon, color="bg-slate-600" }: any) {
  return (
    <button onClick={onClick} className={`p-3 rounded-xl transition ${active ? `${color} text-white shadow-lg scale-105` : 'hover:bg-white/10 text-slate-400'}`}>
      {icon}
    </button>
  );
}

function Bar({ label, val, max, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1 text-slate-300"><span>{label}</span><span>{Math.floor(val)}/{max}</span></div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{width: `${Math.max(0, Math.min(100, (val/max)*100))}%`}}></div>
      </div>
    </div>
  )
}

function Stat({ icon, label, val }: any) {
  return (
    <div className="bg-slate-800/50 p-2 rounded flex items-center gap-2">
      <div className="text-slate-400">{icon}</div>
      <div>
        <div className="text-[10px] text-slate-500 uppercase">{label}</div>
        <div className="text-sm font-bold text-white">{val}</div>
      </div>
    </div>
  )
}