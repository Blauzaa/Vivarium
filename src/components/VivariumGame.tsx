/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

interface GameProps {
  lastCommand: { type: string; data: any } | null;
}

export default function VivariumGame({ lastCommand }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  // 1. INIT GAME ENGINE
  useEffect(() => {
    if (!containerRef.current) return;

    const initApp = async () => {
      const app = new PIXI.Application();
      await app.init({
        resizeTo: window,
        backgroundColor: 0x1e293b, // Slate 900
      });
      
      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }
      appRef.current = app;

      // Background
      const bgTexture = await PIXI.Assets.load('https://opengameart.org/sites/default/files/grass_14.png');
      const bg = new PIXI.TilingSprite(bgTexture, app.screen.width, app.screen.height);
      bg.tint = 0x556655;
      app.stage.addChild(bg);
    };

    initApp();

    return () => {
      // Cleanup PixiJS v8
      appRef.current?.destroy({ children: true } as any);
    };
  }, []);

  // 2. LISTEN TO AI COMMANDS
  useEffect(() => {
    if (!lastCommand || !appRef.current) return;
    const app = appRef.current;

    // TOOL: SPAWN
    if (lastCommand.type === 'spawnCreature') {
      const { count, color } = lastCommand.data;
      
      // Mapping warna string ke Hex
      const colorMap: Record<string, number> = {
        red: 0xff6b6b,
        blue: 0x4dabf7,
        green: 0x69db7c,
        yellow: 0xffd43b
      };
      const hexColor = colorMap[color] || 0xffffff;

      PIXI.Assets.load('https://cdn-icons-png.flaticon.com/512/744/744922.png').then((texture) => {
        for (let i = 0; i < count; i++) {
          const sprite = new PIXI.Sprite(texture);
          sprite.anchor.set(0.5);
          sprite.width = 40; sprite.height = 40;
          sprite.tint = hexColor;
          sprite.x = Math.random() * app.screen.width;
          sprite.y = Math.random() * app.screen.height;
          app.stage.addChild(sprite);
        }
      });
    }

    // TOOL: WEATHER
    if (lastCommand.type === 'changeWeather') {
      const { condition } = lastCommand.data;
      const bg = app.stage.children[0] as PIXI.TilingSprite;
      
      if(bg) {
        if (condition === 'rain') bg.tint = 0x5555aa;
        else if (condition === 'storm') bg.tint = 0x333333;
        else if (condition === 'sunny') bg.tint = 0xffffff;
      }
    }

  }, [lastCommand]);

  return <div ref={containerRef} className="fixed inset-0 z-0" />;
}
