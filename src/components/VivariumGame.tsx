/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

// Tipe Data Lengkap Slime
export interface MinionData {
    id: string;
    gender: 'MALE' | 'FEMALE';
    age: number;
    maxSize: number;
    stats: {
        hp: number; maxHp: number;
        hunger: number; thirst: number; energy: number;
        atk: number; def: number; speed: number;
    };
    traits: string[];
    familyId: string;
    generation: number;
}

// Props dari UI Utama
interface GameProps {
    selectedTool: string;
    objectSize: number;
    spawnConfig: { atk: number; def: number; traits: string[] };
    onSelectMinion: (data: MinionData | null) => void;
}

// Internal Class untuk Logic Game
interface MinionEntity {
    container: PIXI.Container;
    sprite: PIXI.Sprite;
    data: MinionData;
    aiState: string;
    targetPos: { x: number, y: number } | null;
    targetId: string | null; // <--- INI YANG TADI KURANG
    cooldowns: { mate: number; attack: number; brain: number };
}

// Interface untuk Resource
interface ResourceEntity {
    id: string;
    type: 'TREE' | 'WATER' | 'ROCK';
    sprite: PIXI.Sprite;
}

export default function VivariumGame({ selectedTool, objectSize, spawnConfig, onSelectMinion }: GameProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);

    // FIX: Tambahkan tipe data eksplisit <MinionEntity[]>
    const minionsRef = useRef<MinionEntity[]>([]);
    const resourcesRef = useRef<ResourceEntity[]>([]);

    const toolRef = useRef(selectedTool);
    const sizeRef = useRef(objectSize);
    const configRef = useRef(spawnConfig);

    useEffect(() => { toolRef.current = selectedTool; }, [selectedTool]);
    useEffect(() => { sizeRef.current = objectSize; }, [objectSize]);
    useEffect(() => { configRef.current = spawnConfig; }, [spawnConfig]);

    useEffect(() => {
        if (!containerRef.current) return;

        // --- HELPER FUNCTIONS ---

        const spawnMinion = (app: PIXI.Application, x: number, y: number, data: Omit<MinionData, 'id' | 'maxSize'>, color: number) => {
            const container = new PIXI.Container();
            container.x = x; container.y = y;

            const sprite = new PIXI.Sprite(PIXI.Texture.from('/assets/minion.png'));
            sprite.anchor.set(0.5, 1);
            sprite.scale.set(0.05);
            sprite.tint = color;

            const badge = new PIXI.Text({ text: data.gender === 'MALE' ? '♂' : '♀', style: { fontSize: 10, fill: data.gender === 'MALE' ? '#00FFFF' : '#FF69B4' } });
            badge.anchor.set(0.5);
            badge.y = -35;

            container.addChild(sprite);
            container.addChild(badge);
            app.stage.addChild(container);

            minionsRef.current.push({
                container, sprite,
                data: { ...data, id: Math.random().toString(), maxSize: 0.15 },
                aiState: 'WANDER',
                targetPos: null,
                targetId: null, // Sekarang ini valid karena interface sudah diupdate
                cooldowns: { mate: 200, attack: 0, brain: 0 }
            });
        };

        const breed = (app: PIXI.Application, mom: MinionEntity, dad: MinionEntity) => {
            const mixedTraits = [...new Set([...mom.data.traits, ...dad.data.traits])].slice(0, 2);
            const avgAtk = (mom.data.stats.atk + dad.data.stats.atk) / 2;

            spawnMinion(app, mom.container.x, mom.container.y, {
                gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
                generation: mom.data.generation + 1,
                traits: mixedTraits,
                stats: {
                    hp: 50, maxHp: 50,
                    atk: avgAtk, def: (mom.data.stats.def + dad.data.stats.def) / 2,
                    speed: (mom.data.stats.speed + dad.data.stats.speed) / 2,
                    hunger: 0, thirst: 0, energy: 100
                },
                familyId: mom.data.familyId,
                age: 0
            }, 0xFFFF00);
        };

        const askBrain = (m: MinionEntity) => {
            fetch('/api/brain', {
                method: 'POST',
                body: JSON.stringify({
                    stats: m.data.stats,
                    traits: m.data.traits,
                    nearby: ['tree', 'slime']
                })
            })
                .then(r => r.json())
                .then(d => { m.aiState = d.action || 'WANDER'; })
                .catch(() => { });
        };

        const findNearest = (m: MinionEntity, type: string) => {
            let nearest = null;
            let minDst = 9999;
            resourcesRef.current.forEach(r => {
                if (r.type === type) {
                    const d = Math.hypot(r.sprite.x - m.container.x, r.sprite.y - m.container.y);
                    if (d < minDst) { minDst = d; nearest = { x: r.sprite.x, y: r.sprite.y }; }
                }
            });
            return nearest;
        };

        const findNearestSlime = (me: MinionEntity, mode: 'PARTNER' | 'ENEMY') => {
            let nearest: MinionEntity | null = null;
            let minDst = 300;
            minionsRef.current.forEach(other => {
                if (other === me) return;
                const d = Math.hypot(other.container.x - me.container.x, other.container.y - me.container.y);
                if (d < minDst) {
                    if (mode === 'PARTNER' && other.data.gender !== me.data.gender && other.data.age > 18) {
                        minDst = d; nearest = other;
                    }
                    if (mode === 'ENEMY' && other.data.familyId !== me.data.familyId) {
                        minDst = d; nearest = other;
                    }
                }
            });
            return nearest;
        };

        const moveTo = (m: MinionEntity, target: { x: number, y: number } | null, delta: number, stopDist: number, onReach: () => void) => {
            if (!target) { m.aiState = 'WANDER'; return; }
            const dx = target.x - m.container.x;
            const dy = target.y - m.container.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < stopDist) { onReach(); }
            else {
                const angle = Math.atan2(dy, dx);
                m.container.x += Math.cos(angle) * m.data.stats.speed * delta;
                m.container.y += Math.sin(angle) * m.data.stats.speed * delta;
            }
        };

        const moveToPos = (m: MinionEntity, target: { x: number, y: number }, delta: number) => {
            const dx = target.x - m.container.x;
            const dy = target.y - m.container.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 5) return;
            const angle = Math.atan2(dy, dx);
            m.container.x += Math.cos(angle) * m.data.stats.speed * delta;
            m.container.y += Math.sin(angle) * m.data.stats.speed * delta;
        };

        const hasReached = (c: PIXI.Container, t: { x: number, y: number }) => Math.hypot(c.x - t.x, c.y - t.y) < 10;

        // --- INIT PIXI APP ---
        const initApp = async () => {
            const app = new PIXI.Application();
            await app.init({ resizeTo: window, backgroundColor: 0x1e293b });

            if (containerRef.current) {
                containerRef.current.innerHTML = '';
                containerRef.current.appendChild(app.canvas);
            }
            appRef.current = app;

            app.stage.sortableChildren = true;
            app.stage.eventMode = 'static';
            app.stage.hitArea = app.screen;

            try {
                await PIXI.Assets.load(['/assets/grass.png', '/assets/tree.png', '/assets/rock.png', '/assets/water.png', '/assets/minion.png']);
            } catch (e) { console.error("Asset Load Error", e); }

            const bg = new PIXI.TilingSprite({ texture: PIXI.Texture.from('/assets/grass.png'), width: app.screen.width, height: app.screen.height });
            bg.tileScale.set(0.3); bg.tint = 0x556655; bg.zIndex = -1000;
            app.stage.addChild(bg);

            // --- CLICK HANDLER ---
            app.stage.on('pointerdown', (event) => {
                const { x, y } = event.global;
                const tool = toolRef.current;

                if (tool === 'NONE') {
                    const clickedMinion = minionsRef.current.find(m => {
                        const dx = m.container.x - x;
                        const dy = m.container.y - y;
                        return Math.sqrt(dx * dx + dy * dy) < 30;
                    });
                    // Prop onSelectMinion aman dipanggil disini
                    if (onSelectMinion) onSelectMinion(clickedMinion ? clickedMinion.data : null);
                    return;
                }

                if (tool === 'DELETE') {
                    const hitSlimeIdx = minionsRef.current.findIndex(m => Math.hypot(m.container.x - x, m.container.y - y) < 30);
                    if (hitSlimeIdx !== -1) {
                        app.stage.removeChild(minionsRef.current[hitSlimeIdx].container);
                        minionsRef.current.splice(hitSlimeIdx, 1);
                    }
                    const hitResIdx = resourcesRef.current.findIndex(r => Math.hypot(r.sprite.x - x, r.sprite.y - y) < 40);
                    if (hitResIdx !== -1) {
                        app.stage.removeChild(resourcesRef.current[hitResIdx].sprite);
                        resourcesRef.current.splice(hitResIdx, 1);
                    }
                    return;
                }

                if (tool === 'SLIME') {
                    const traits = configRef.current.traits;
                    let color = 0xFFFFFF;
                    if (traits.includes('Aggressive')) color = 0xFF4444;
                    if (traits.includes('Lazy')) color = 0x8888FF;

                    spawnMinion(app, x, y, {
                        gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
                        generation: 1,
                        traits: traits,
                        stats: {
                            hp: 100, maxHp: 100,
                            atk: configRef.current.atk,
                            def: configRef.current.def,
                            speed: traits.includes('Lazy') ? 0.5 : 1.5,
                            hunger: 0, thirst: 0, energy: 100
                        },
                        familyId: Date.now().toString(),
                        age: 0
                    }, color);
                }

                if (['TREE', 'ROCK', 'WATER'].includes(tool)) {
                    const texture = PIXI.Texture.from(`/assets/${tool.toLowerCase()}.png`);
                    const sprite = new PIXI.Sprite(texture);
                    sprite.anchor.set(0.5);
                    sprite.scale.set(sizeRef.current);
                    sprite.x = x; sprite.y = y;
                    sprite.zIndex = tool === 'WATER' ? -500 : y;
                    sprite.alpha = tool === 'WATER' ? 0.8 : 1;
                    app.stage.addChild(sprite);

                    resourcesRef.current.push({
                        id: Date.now().toString(),
                        type: tool as any,
                        sprite
                    });
                }
            });

            // --- GAME LOOP ---
            app.ticker.add((ticker) => {
                const delta = ticker.deltaTime;

                for (let i = minionsRef.current.length - 1; i >= 0; i--) {
                    const m = minionsRef.current[i];

                    // Death Check
                    if (m.data.stats.hp <= 0 || m.data.stats.hunger >= 100 || m.data.stats.thirst >= 100) {
                        app.stage.removeChild(m.container);
                        minionsRef.current.splice(i, 1);
                        continue;
                    }

                    // Growth
                    if (m.data.age < 100) {
                        m.data.age += 0.05 * delta;
                        const growthRatio = Math.min(1, m.data.age / 20);
                        const currentScale = 0.05 + (0.1 * growthRatio);
                        m.sprite.scale.set(currentScale);
                    }

                    // Metabolism
                    m.data.stats.hunger += 0.03 * delta;
                    m.data.stats.thirst += 0.04 * delta;
                    m.data.stats.energy -= 0.01 * delta;
                    m.cooldowns.mate -= delta;
                    m.cooldowns.attack -= delta;
                    m.cooldowns.brain -= delta;

                    // Brain Trigger
                    if (m.cooldowns.brain <= 0) {
                        m.cooldowns.brain = 120 + Math.random() * 60;
                        askBrain(m);
                    }

                    // Local Logic Override
                    if (m.data.stats.thirst > 70) m.aiState = 'DRINK';
                    else if (m.data.stats.hunger > 70) m.aiState = 'EAT';

                    // Action Execution
                    if (m.aiState === 'EAT') {
                        const target = findNearest(m, 'TREE');
                        moveTo(m, target, delta, 20, () => {
                            m.data.stats.hunger = Math.max(0, m.data.stats.hunger - 30);
                            m.aiState = 'WANDER';
                        });
                    }
                    else if (m.aiState === 'DRINK') {
                        const target = findNearest(m, 'WATER');
                        moveTo(m, target, delta, 40, () => {
                            m.data.stats.thirst = Math.max(0, m.data.stats.thirst - 40);
                            m.aiState = 'WANDER';
                        });
                    }
                    else if (m.aiState === 'ATTACK') {
                        const target = findNearestSlime(m, 'ENEMY');
                        if (target) {
                            const t = target as MinionEntity;
                            moveTo(m, { x: t.container.x, y: t.container.y }, delta, 25, () => {
                                if (m.cooldowns.attack <= 0) {
                                    const dmg = Math.max(1, m.data.stats.atk - (t.data.stats.def / 2));
                                    t.data.stats.hp -= dmg;
                                    m.cooldowns.attack = 60;
                                    t.sprite.tint = 0xFF0000;
                                    setTimeout(() => t.sprite.tint = 0xFFFFFF, 100);
                                }
                            });
                        } else { m.aiState = 'WANDER'; }
                    }
                    else if (m.aiState === 'MATE') {
                        const partner = findNearestSlime(m, 'PARTNER');
                        if (partner) {
                            const p = partner as MinionEntity;
                            moveTo(m, { x: p.container.x, y: p.container.y }, delta, 20, () => {
                                if (m.data.gender === 'FEMALE' && m.cooldowns.mate <= 0 && p.cooldowns.mate <= 0) {
                                    breed(app, m, p);
                                    m.cooldowns.mate = 1000;
                                    p.cooldowns.mate = 1000;
                                    m.aiState = 'WANDER';
                                }
                            });
                        } else { m.aiState = 'WANDER'; }
                    }
                    else if (m.aiState === 'WANDER') {
                        if (!m.targetPos || hasReached(m.container, m.targetPos)) {
                            m.targetPos = {
                                x: Math.max(50, Math.min(app.screen.width - 50, m.container.x + (Math.random() - 0.5) * 200)),
                                y: Math.max(50, Math.min(app.screen.height - 50, m.container.y + (Math.random() - 0.5) * 200))
                            };
                        }
                        moveToPos(m, m.targetPos, delta);
                    }

                    // Visual Update
                    m.container.zIndex = m.container.y;
                    m.sprite.y = -Math.abs(Math.sin(Date.now() / 150 + Number(m.data.id))) * 5;
                }
            });
        };

        initApp();

        return () => {
            if (appRef.current) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                appRef.current.destroy(true as any);
                appRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={containerRef} className="fixed inset-0 z-0 cursor-crosshair" />;
}