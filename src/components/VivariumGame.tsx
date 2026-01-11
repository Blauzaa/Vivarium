/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

// Props menerima alat yang dipilih dari Page
interface GameProps {
  selectedTool: string;
}

interface Minion {
  sprite: PIXI.Sprite;
  text: PIXI.Text;
  stats: { hunger: number; energy: number };
  aiState: 'WANDER' | 'EAT' | 'SLEEP';
}

export default function VivariumGame({ selectedTool }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const minionsRef = useRef<Minion[]>([]);
  
  // Ref untuk menyimpan selectedTool agar bisa diakses di dalam event listener PIXI
  // (Karena event listener PIXI kadang tidak membaca state React terbaru secara langsung)
  const toolRef = useRef(selectedTool);

  // Update ref setiap kali prop berubah
  useEffect(() => {
    toolRef.current = selectedTool;
  }, [selectedTool]);

  useEffect(() => {
    if (!containerRef.current) return;

    const initApp = async () => {
      const app = new PIXI.Application();
      await app.init({ 
        resizeTo: window, 
        backgroundColor: 0x1e293b 
      });
      
      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }
      appRef.current = app;
      
      // CONFIG PENTING AGAR BISA DIKLIK & SORTING
      app.stage.sortableChildren = true; 
      app.stage.eventMode = 'static'; 
      app.stage.hitArea = app.screen; // Seluruh layar bisa diklik

      // Load Assets
      try {
        await PIXI.Assets.load([
            '/assets/grass.png', '/assets/tree.png', 
            '/assets/rock.png', '/assets/water.png', '/assets/minion.png'
        ]);
        console.log("✅ Assets Ready");
      } catch (e) {
        console.error("❌ Assets Missing", e);
      }

      // Background
      const bg = new PIXI.TilingSprite({ 
        texture: PIXI.Texture.from('/assets/grass.png'), 
        width: app.screen.width, 
        height: app.screen.height 
      });
      bg.tileScale.set(0.3);
      bg.tint = 0x556655;
      bg.zIndex = -1000;
      app.stage.addChild(bg);

      // --- EVENT LISTENER: KLIK UNTUK MENARUH OBJEK ---
      app.stage.on('pointerdown', (event) => {
        // Ambil posisi mouse saat diklik
        const { x, y } = event.global;
        const currentTool = toolRef.current;

        console.log(`🖱️ Clicked at ${Math.floor(x)},${Math.floor(y)} with tool: ${currentTool}`);

        if (currentTool === 'NONE') return;

        // 1. SPAWN SLIME
        if (currentTool === 'SLIME') {
            const sprite = new PIXI.Sprite(PIXI.Texture.from('/assets/minion.png'));
            sprite.anchor.set(0.5);
            sprite.scale.set(0.15);
            sprite.x = x;
            sprite.y = y;
            sprite.zIndex = y; // Z-Index sesuai posisi Y (Depth)
            sprite.tint = Math.random() * 0xFFFFFF; // Warna Warni

            const text = new PIXI.Text({ text: '...', style: { fontSize: 10, fill: 'white' } });
            text.anchor.set(0.5);
            
            app.stage.addChild(sprite);
            app.stage.addChild(text);

            minionsRef.current.push({
                sprite,
                text,
                stats: { hunger: 0, energy: 100 },
                aiState: 'WANDER'
            });
        }

        // 2. SPAWN TREE
        if (currentTool === 'TREE') {
            const sprite = new PIXI.Sprite(PIXI.Texture.from('/assets/tree.png'));
            sprite.anchor.set(0.5);
            sprite.scale.set(0.2);
            sprite.x = x;
            sprite.y = y;
            sprite.zIndex = y;
            app.stage.addChild(sprite);
        }

        // 3. SPAWN ROCK
        if (currentTool === 'ROCK') {
            const sprite = new PIXI.Sprite(PIXI.Texture.from('/assets/rock.png'));
            sprite.anchor.set(0.5);
            sprite.scale.set(0.15);
            sprite.x = x;
            sprite.y = y;
            sprite.zIndex = y;
            app.stage.addChild(sprite);
        }

        // 4. SPAWN WATER
        if (currentTool === 'WATER') {
            const sprite = new PIXI.Sprite(PIXI.Texture.from('/assets/water.png'));
            sprite.anchor.set(0.5);
            sprite.scale.set(0.5);
            sprite.x = x;
            sprite.y = y;
            sprite.zIndex = -500; // Air selalu di bawah
            sprite.alpha = 0.8;
            app.stage.addChild(sprite);
        }
      });

      // --- GAME LOOP ---
      app.ticker.add((ticker) => {
        const delta = ticker.deltaTime;
        
        minionsRef.current.forEach(minion => {
          // Metabolisme
          minion.stats.hunger += 0.05 * delta;
          minion.stats.energy -= 0.02 * delta;

          // AI Logic
          if (minion.aiState === 'WANDER') {
             minion.sprite.x += (Math.random() - 0.5) * 2;
             minion.sprite.y += (Math.random() - 0.5) * 2;
          } else if (minion.aiState === 'EAT') {
             minion.sprite.x += (Math.random() - 0.5) * 5;
             minion.sprite.y += (Math.random() - 0.5) * 5;
             minion.stats.hunger = Math.max(0, minion.stats.hunger - 0.5);
          } else if (minion.aiState === 'SLEEP') {
             minion.stats.energy += 0.1; 
          }

          // Bounds
          if (minion.sprite.x < 0) minion.sprite.x = 0;
          if (minion.sprite.x > app.screen.width) minion.sprite.x = app.screen.width;
          if (minion.sprite.y < 0) minion.sprite.y = 0;
          if (minion.sprite.y > app.screen.height) minion.sprite.y = app.screen.height;

          // Update Layer & Text
          minion.sprite.zIndex = minion.sprite.y;
          minion.text.text = `${minion.aiState}\nH:${Math.floor(minion.stats.hunger)}%`;
          minion.text.x = minion.sprite.x;
          minion.text.y = minion.sprite.y - 35;
        });
      });
    };

    initApp();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true as any);
        appRef.current = null;
      }
    };
  }, []); // Init hanya sekali

  // --- BRAIN LOOP ---
  useEffect(() => {
    const interval = setInterval(() => {
        if (minionsRef.current.length === 0) return;
        const randomIdx = Math.floor(Math.random() * minionsRef.current.length);
        const minion = minionsRef.current[randomIdx];

        fetch('/api/brain', {
            method: 'POST',
            body: JSON.stringify({
                hunger: Math.floor(minion.stats.hunger),
                energy: Math.floor(minion.stats.energy)
            })
        })
        .then(res => res.json())
        .then(data => {
            minion.aiState = data.action || 'WANDER';
        })
        .catch(err => console.error(err));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return <div ref={containerRef} className="fixed inset-0 z-0 cursor-crosshair" />;
}