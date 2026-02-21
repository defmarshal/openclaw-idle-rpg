'use client';

import { useState, useEffect, useCallback } from 'react';
import AgentCard from './components/AgentCard';
import EventLog from './components/EventLog';
import TechTree from './components/TechTree';
import Achievements from './components/Achievements';

// --- Game constants ---
const RESOURCE_NAMES = {
  memory: 'Memory (MB)',
  cpu: 'CPU Units',
  tokens: 'Tokens',
};

const INITIAL_AGENTS = [
  { id: 'dev', name: 'Dev Agent', baseRate: 1, level: 1, costMultiplier: 1.5, ability: { id: 'quick-fix', name: 'Quick Fix', cost: { memory: 10, cpu: 0, tokens: 0 }, cooldown: 30000, lastUsed: 0, desc: 'Instantly resolve a crisis.' } },
  { id: 'content', name: 'Content Agent', baseRate: 0.8, level: 1, costMultiplier: 1.6, ability: { id: 'burst-write', name: 'Burst Write', cost: { memory: 0, cpu: 0, tokens: 20 }, cooldown: 45000, lastUsed: 0, desc: '2x all production for 15s.' } },
  { id: 'research', name: 'Research Agent', baseRate: 0.6, level: 1, costMultiplier: 1.7, ability: { id: 'deep-dive', name: 'Deep Dive', cost: { memory: 50, cpu: 0, tokens: 0 }, cooldown: 60000, lastUsed: 0, desc: '5x Token production for 10s.' } },
  { id: 'idea-gen', name: 'Idea Generator', baseRate: 0.4, level: 1, costMultiplier: 1.8, ability: { id: 'eureka', name: 'Eureka', cost: { memory: 0, cpu: 100, tokens: 0 }, cooldown: 90000, lastUsed: 0, desc: 'Instant +10 Ideas count (todo).' } },
  { id: 'idea-exec', name: 'Idea Executor', baseRate: 0.5, level: 1, costMultiplier: 1.6, ability: { id: 'overclock', name: 'Overclock', cost: { memory: 0, cpu: 0, tokens: 100 }, cooldown: 120000, lastUsed: 0, desc: 'Execute 3 ideas instantly (todo).' } },
];

const TECHNICAL_UPGRADES = [
  { id: 'better-servers', name: 'Better Servers', cost: { memory: 100 }, effect: 'productionMultiply', attribute: null, value: 1.2, desc: '+20% all production' },
  { id: 'auto-upgrades', name: 'Auto Upgrades', cost: { memory: 250 }, effect: 'autoUpgrade', value: true, desc: 'Agents auto-upgrade when affordable' },
  { id: 'llm-optimization', name: 'LLM Optimization', cost: { memory: 300, tokens: 50 }, effect: 'productionMultiply', attribute: 'tokens', value: 1.5, desc: '+50% Token production' },
  { id: 'parallel-agents', name: 'Parallel Agents', cost: { memory: 500 }, effect: 'addAgentSlot', value: 1, desc: '+1 agent slot' },
  { id: 'ai-coach', name: 'AI Coach', cost: { memory: 800 }, effect: 'crisisReduction', value: 0.5, desc: '-50% crisis frequency' },
  { id: 'infinite-tokens', name: 'Infinite Tokens', cost: { memory: 2000, cpu: 200 }, effect: 'productionMultiply', attribute: 'tokens', value: 2, desc: '2x Token production' },
  { id: 'offline-efficiency', name: 'Offline Efficiency', cost: { memory: 1000, cpu: 500 }, effect: 'offlineMultiplier', value: 2, desc: '2x offline production' },
];

const ACHIEVEMENTS = [
  { id: 'first-upgrade', name: 'First Upgrade', desc: 'Upgrade any agent to level 2', condition: (s) => s.agents.some(a => a.level > 1) },
  { id: 'memory-1000', name: 'Gigabyte', desc: 'Reach 1000 Memory', condition: (s) => s.resources.memory >= 1000, reward: { memory: 100 } },
  { id: 'cpu-500', name: 'Half Kilocore', desc: 'Reach 500 CPU', condition: (s) => s.resources.cpu >= 500, reward: { cpu: 50 } },
  { id: 'tokens-1000', name: 'Token Hoarder', desc: 'Reach 1000 Tokens', condition: (s) => s.resources.tokens >= 1000, reward: { tokens: 100 } },
  { id: 'level-10', name: 'Senior Agent', desc: 'Have an agent at level 10', condition: (s) => s.agents.some(a => a.level >= 10), reward: { memory: 500 } },
  { id: 'survive-10-crises', name: 'Resilient', desc: 'Survive 10 crises', condition: (s) => s.stats.crisesSurvived >= 10, reward: { tokens: 200 } },
  { id: 'purchase-3-upgrades', name: 'Tech Explorer', desc: 'Purchase 3 tech upgrades', condition: (s) => s.techUpgrades.length >= 3, reward: { cpu: 100 } },
];

const QUESTS = [
  { id: 'upgrade-level-5', name: 'Rising Star', desc: 'Upgrade any agent to level 5', target: () => true, reward: { memory: 200 }, completed: false },
  { id: 'reach-5k-memory', name: 'Megabyte', desc: 'Reach 5,000 Memory', target: (s) => s.resources.memory >= 5000, reward: { tokens: 500 }, completed: false },
  { id: 'use-5-abilities', name: 'Power User', desc: 'Use agent abilities 5 times', target: () => false, reward: { cpu: 100 }, progress: 0, targetCount: 5 },
];

export default function HomePage() {
  const [resources, setResources] = useState({ memory: 0, cpu: 0, tokens: 0 });
  const [prestigePoints, setPrestigePoints] = useState(0);
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [log, setLog] = useState([]);
  const [lastTick, setLastTick] = useState(Date.now());
  const [activeAbilities, setActiveAbilities] = useState({});
  const [techUpgrades, setTechUpgrades] = useState([]);
  const [achieved, setAchieved] = useState([]);
  const [quests, setQuests] = useState(QUESTS);
  const [dailyStreak, setDailyStreak] = useState(1);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [stats, setStats] = useState({ crisesSurvived: 0, boonsFound: 0, totalUpgrades: 0, abilitiesUsed: 0 });
  const [activeTab, setActiveTab] = useState('agents');
  const [showSettings, setShowSettings] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState([]); // [{id, x, y, text, color}]

  // Helper: add floating text effect
  const addFloatingText = useCallback((text, x, y, color = '#fff') => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== id)), 1500);
  }, []);

  // Offline progress calculation on mount
  useEffect(() => {
    const saved = localStorage.getItem('openclaw-idle-rpg-save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.version && data.version >= 2) {
          const now = Date.now();
          const lastSave = data.lastTick || now;
          const offlineSecs = Math.floor((now - lastSave) / 1000);
          const maxOfflineHours = 24;
          const offlineSecsCapped = Math.min(offlineSecs, maxOfflineHours * 3600);
          if (offlineSecsCapped > 0) {
            // Compute offline production
            let mult = 1;
            if (data.techUpgrades?.includes('offline-efficiency')) mult *= 2;
            const agentsProduce = data.agents.reduce((sum, agent) => sum + agent.baseRate * agent.level, 0);
            const memGain = agentsProduce * 0.5 * mult * offlineSecsCapped;
            const cpuGain = agentsProduce * 0.3 * mult * offlineSecsCapped;
            const tokGain = agentsProduce * 0.2 * mult * offlineSecsCapped;
            setResources(prev => ({
              memory: Math.round((prev.memory + memGain) * 100) / 100,
              cpu: Math.round((prev.cpu + cpuGain) * 100) / 100,
              tokens: Math.round((prev.tokens + tokGain) * 100) / 100,
            }));
            addLog(`Offline progress: +${Math.floor(memGain)} Memory, +${Math.floor(cpuGain)} CPU, +${Math.floor(tokGain)} Tokens (${offlineSecsCapped}s)`);
          }
          setPrestigePoints(data.prestigePoints || 0);
          setAgents(data.agents);
          setTechUpgrades(data.techUpgrades || []);
          setAchieved(data.achieved || []);
          setStats(data.stats || { crisesSurvived: 0, boonsFound: 0, totalUpgrades: 0, abilitiesUsed: 0 });
          setQuests(data.quests || QUESTS);
          setDailyStreak(data.dailyStreak || 1);
          setDailyClaimed(data.dailyClaimed || false);
        }
      } catch (e) {
        console.error('Save load failed', e);
      }
    }
  }, [addFloatingText]);

  // Save game (version 2+)
  useEffect(() => {
    const interval = setInterval(() => {
      const save = {
        version: 2,
        resources,
        agents,
        log,
        techUpgrades,
        achieved,
        stats,
        quests,
        dailyStreak,
        dailyClaimed,
        lastTick: Date.now(),
        prestigePoints,
      };
      localStorage.setItem('openclaw-idle-rpg-save', JSON.stringify(save));
    }, 10000);
    return () => clearInterval(interval);
  }, [resources, agents, log, techUpgrades, achieved, stats, quests, dailyStreak, dailyClaimed, prestigePoints]);

  // Compute multipliers
  const getProductionMultiplier = useCallback((attr) => {
    let mult = 1;
    mult += prestigePoints * 0.05; // +5% per prestige
    techUpgrades.forEach(t => {
      if (t.effect === 'productionMultiply' && (!t.attribute || t.attribute === attr)) {
        mult *= t.value;
      }
    });
    return mult;
  }, [techUpgrades, prestigePoints]);

  // Production loop
  useEffect(() => {
    const interval = setInterval(() => {
      setLastTick(Date.now());
      setResources(prev => {
        const newRes = { ...prev };
        agents.forEach(agent => {
          const base = agent.baseRate * agent.level;
          const memMult = getProductionMultiplier('memory') * (activeAbilities['burst-write'] ? 2 : 1);
          const cpuMult = getProductionMultiplier('cpu') * (activeAbilities['burst-write'] ? 2 : 1);
          const tokenMult = getProductionMultiplier('tokens') * (activeAbilities['burst-write'] ? 2 : 1) * (activeAbilities['deep-dive'] ? 5 : 1);
          const memGain = base * 0.5 * memMult;
          const cpuGain = base * 0.3 * cpuMult;
          const tokGain = base * 0.2 * tokenMult;
          newRes.memory += memGain;
          newRes.cpu += cpuGain;
          newRes.tokens += tokGain;
          // Floating text effect for +1 resource events (small random chance)
          if (Math.random() < 0.02) {
            const text = `+${Math.round(memGain)}`;
            addFloatingText(text, Math.random() * 80 + 10, Math.random() * 40 + 20, '#a5f3fc');
          }
        });
        Object.keys(newRes).forEach(k => { newRes[k] = Math.round(newRes[k] * 100) / 100; });
        return newRes;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [agents, getProductionMultiplier, activeAbilities, addFloatingText]);

  // Ability cooldown countdown
  useEffect(() => {
    const tick = setInterval(() => {
      setActiveAbilities(prev => {
        const next = {};
        Object.entries(prev).forEach(([k, sec]) => {
          if (sec > 1) next[k] = sec - 1;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const addLog = (msg) => {
    setLog(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()} — ${msg}`]);
  };

  // Upgrade agent
  const upgradeAgent = useCallback((id) => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return;
    const cost = Math.floor(10 * Math.pow(agent.costMultiplier, agent.level));
    if (resources.memory < cost) {
      addLog(`Not enough Memory to upgrade ${agent.name} (need ${cost})`);
      return;
    }
    setResources(prev => ({ ...prev, memory: prev.memory - cost }));
    setAgents(prev => prev.map(a => a.id === id ? { ...a, level: a.level + 1 } : a));
    setStats(s => ({ ...s, totalUpgrades: s.totalUpgrades + 1 }));
    addLog(`Upgraded ${agent.name} to level ${agent.level + 1} (cost ${cost})`);
    addFloatingText(`+${cost}`, 0, 0, '#fbbf24'); // position near button would need ref; simplified
  }, [agents, resources, addFloatingText]);

  // Use ability
  const useAbility = useCallback((agentId) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent || !agent.ability) return;
    const ab = agent.ability;
    const now = Date.now();
    if (ab.lastUsed && now - (ab.lastUsed || 0) < ab.cooldown) {
      const remaining = Math.round((ab.cooldown - (now - (ab.lastUsed || 0))) / 1000);
      addLog(`${agent.name}'s ${ab.name} on cooldown (${remaining}s)`);
      return;
    }
    if (resources.memory < ab.cost.memory || resources.cpu < ab.cost.cpu || resources.tokens < ab.cost.tokens) {
      addLog(`Not enough resources for ${agent.name}'s ${ab.name}`);
      return;
    }
    setResources(prev => ({
      memory: prev.memory - ab.cost.memory,
      cpu: prev.cpu - ab.cost.cpu,
      tokens: prev.tokens - ab.cost.tokens,
    }));
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, ability: { ...ab, lastUsed: now } } : a));
    setActiveAbilities(prev => ({ ...prev, [ab.id]: Math.round(ab.cooldown / 1000) }));
    setStats(s => ({ ...s, abilitiesUsed: s.abilitiesUsed + 1 }));
    addLog(`${agent.name} used ${ab.name}!`);
  }, [agents, resources]);

  // Purchase tech
  const purchaseTech = useCallback((tech) => {
    if (techUpgrades.includes(tech.id)) {
      addLog(`Already purchased: ${tech.name}`);
      return;
    }
    const c = tech.cost;
    if (resources.memory < c.memory || resources.cpu < c.cpu || resources.tokens < c.tokens) {
      addLog(`Insufficient resources for ${tech.name}`);
      return;
    }
    setResources(prev => ({
      memory: prev.memory - c.memory,
      cpu: prev.cpu - c.cpu,
      tokens: prev.tokens - c.tokens,
    }));
    setTechUpgrades(prev => [...prev, tech.id]);
    addLog(`Purchased tech: ${tech.name}`);
  }, [resources, techUpgrades]);

  // Prestige
  const PRESTIGE_THRESHOLD = 1000000;
  const canPrestige = resources.memory >= PRESTIGE_THRESHOLD;
  const prestige = useCallback(() => {
    if (!canPrestige) return;
    const newPP = prestigePoints + 1;
    setPrestigePoints(newPP);
    setResources({ memory: 0, cpu: 0, tokens: 0 });
    setAgents(INITIAL_AGENTS);
    setTechUpgrades([]);
    setAchieved([]);
    setStats({ crisesSurvived: 0, boonsFound: 0, totalUpgrades: 0, abilitiesUsed: 0 });
    setQuests(QUESTS);
    addLog(`Prestiged! Now have ${newPP} Prestige Point(s). Production +${newPP * 5}%`);
  }, [canPrestige, prestigePoints]);

  // Daily claim
  const claimDaily = useCallback(() => {
    if (dailyClaimed) return;
    setDailyClaimed(true);
    const bonus = 100 + (prestigePoints * 20);
    setResources(prev => ({ ...prev, memory: prev.memory + bonus }));
    addLog(`Daily login reward: +${bonus} Memory! (Streak: ${dailyStreak})`);
  }, [dailyClaimed, prestigePoints, dailyStreak]);

  // Random events
  useEffect(() => {
    const interval = setInterval(() => {
      const crisisChance = techUpgrades.includes('ai-coach') ? 0.15 : 0.3;
      if (Math.random() < crisisChance) {
        const roll = Math.random();
        if (roll < 0.5) {
          const loss = Math.max(1, Math.round(resources.memory * 0.1));
          setResources(r => ({ ...r, memory: Math.max(0, r.memory - loss) }));
          setStats(s => ({ ...s, crisesSurvived: s.crisesSurvived + 1 }));
          addLog(`🚨 Crisis: Memory leak! Lost ${loss} Memory.`);
        } else {
          const gain = Math.round(10 + resources.cpu * 0.1);
          setResources(r => ({ ...r, tokens: r.tokens + gain }));
          setStats(s => ({ ...s, boonsFound: s.boonsFound + 1 }));
          addLog(`✨ Boon: Token bonus +${gain}!`);
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [resources, techUpgrades]);

  // Auto-upgrade tech
  useEffect(() => {
    if (techUpgrades.includes('auto-upgrades')) {
      const interval = setInterval(() => {
        setResources(prev => {
          let anyUpgrade = false;
          const newAgents = agents.map(agent => {
            const cost = Math.floor(10 * Math.pow(agent.costMultiplier, agent.level));
            if (prev.memory >= cost) {
              anyUpgrade = true;
              return { ...agent, level: agent.level + 1 };
            }
            return agent;
          });
          if (anyUpgrade) {
            setAgents(newAgents);
            setStats(s => ({ ...s, totalUpgrades: s.totalUpgrades + 1 }));
            addLog('Auto-upgrade triggered!');
          }
          return prev;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [techUpgrades, agents]);

  // Check achievements
  useEffect(() => {
    ACHIEVEMENTS.forEach(a => {
      if (!achieved.includes(a.id) && a.condition({ resources, agents, techUpgrades, stats, prestigePoints })) {
        setAchieved(prev => [...prev, a.id]);
        if (a.reward) {
          setResources(prev => ({ ...prev, ...a.reward }));
          addLog(`🏆 Achievement: ${a.name} — rewarded ${Object.entries(a.reward).map(([k,v]) => `${v} ${RESOURCE_NAMES[k]}`).join(', ')}`);
        } else {
          addLog(`🏆 Achievement: ${a.name}`);
        }
      }
    });
  }, [resources, agents, techUpgrades, stats, achieved, prestigePoints]);

  const exportSave = () => {
    const save = { version: 2, resources, agents, techUpgrades, achieved, stats, quests, dailyStreak, dailyClaimed, prestigePoints };
    const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openclaw-idle-rpg-save-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSave = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result || '{}');
        if (data.version && data.version >= 2) {
          setResources(data.resources);
          setPrestigePoints(data.prestigePoints || 0);
          setAgents(data.agents);
          setTechUpgrades(data.techUpgrades || []);
          setAchieved(data.achieved || []);
          setStats(data.stats || { crisesSurvived: 0, boonsFound: 0, totalUpgrades: 0, abilitiesUsed: 0 });
          setQuests(data.quests || QUESTS);
          setDailyStreak(data.dailyStreak || 1);
          setDailyClaimed(data.dailyClaimed || false);
          addLog('Save imported successfully!');
        } else {
          alert('Invalid save version.');
        }
      } catch (err) {
        alert('Failed to parse save file.');
      }
    };
    reader.readAsText(file);
  };

  // Reset save
  const resetSave = () => {
    if (confirm('Are you sure? This will delete all progress.')) {
      localStorage.removeItem('openclaw-idle-rpg-save');
      window.location.reload();
    }
  };

  // Compute prestige bonus display
  const prestigeBonus = Math.round(prestigePoints * 5);

  return (
    <div className="min-h-screen p-4 relative overflow-hidden bg-hearts">
      {/* Floating resource gain texts */}
      {floatingTexts.map(t => (
        <div key={t.id} className="fixed pointer-events-none animate-bounce z-50" style={{ left: t.x, top: t.y, color: t.color, textShadow: '0 0 5px white' }}>
          <span className="text-2xl">✨</span>
        </div>
      ))}

      {/* Header with kawaii decorations */}
      <header className="mb-8 text-center relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-3xl animate-sparkle">★ ♡ ★</div>
        <h1 className="text-5xl font-black text-black mb-2" style={{ fontFamily: "'Press Start 2P', cursive" }}>OpenClaw Idle RPG</h1>
        <p className="text-black font-bold text-2xl">✨ Manage agents, gather resources, survive crises! ✨</p>
        <div className="mt-4 flex justify-center gap-6 text-base">
          <div className="kawaii-card px-4 py-2 flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <span className="font-bold text-black">Prestige:</span>
            <span className="text-pink-600 font-black text-xl">{prestigePoints}</span>
            <span className="text-black font-bold">(+{prestigeBonus}% production)</span>
          </div>
          <div className="kawaii-card px-4 py-2 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <span className="font-bold text-black">Streak:</span>
            <span className="text-green-700 font-black text-xl">{dailyStreak}</span>
            <span className="text-black font-bold">days</span>
          </div>
        </div>
      </header>

      {/* Resources */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {Object.entries(RESOURCE_NAMES).map(([key, label]) => (
          <div key={key} className="kawaii-card text-center transform hover:scale-105 transition-shadow hover:shadow-lg">
            <div className="text-lg font-black text-black mb-3 uppercase tracking-wide">{label}</div>
            <div className="text-7xl font-black text-black drop-shadow-md">{Math.floor(resources[key])}</div>
            <div className="text-base text-pink-600 mt-2 font-bold">💖</div>
          </div>
        ))}
      </div>

      {/* Daily claim button */}
      {!dailyClaimed && (
        <div className="mb-6 text-center">
          <button onClick={claimDaily} className="kawaii-btn px-6 py-3 text-lg flex items-center gap-2 mx-auto">
            <span>🎁</span>
            <span>Claim Daily Reward!</span>
            <span>+{100 + (prestigePoints * 20)} 💾</span>
          </button>
        </div>
      )}

      {/* Prestige button */}
      {canPrestige && (
        <div className="mb-6 text-center animate-pulse">
          <button onClick={prestige} className="kawaii-btn px-8 py-4 text-xl flex items-center gap-3 mx-auto bg-gradient-to-r from-yellow-300 to-pink-300 text-black font-black">
            <span>🌟</span>
            <span>Prestige!</span>
            <span>+1 PP</span>
            <span>+5% ⬆️</span>
          </button>
          <div className="text-sm text-black mt-2 font-bold">Requires {PRESTIGE_THRESHOLD.toLocaleString()} Memory. Resets progress but gives permanent bonus.</div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3 justify-center">
          {['agents', 'tech', 'achievements', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`kawaii-btn px-6 py-3 text-lg capitalize font-bold ${activeTab === tab ? 'ring-4 ring-pink-500 scale-105' : ''}`}
            >
              {tab === 'agents' && '👾 '}
              {tab === 'tech' && '🔧 '}
              {tab === 'achievements' && '🏆 '}
              {tab === 'settings' && '⚙️ '}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onUpgrade={upgradeAgent}
              resources={resources.memory}
              onUseAbility={() => useAbility(agent.id)}
              abilityCooldown={activeAbilities[agent.ability?.id] ? activeAbilities[agent.ability.id] * 1000 : 0}
            />
          ))}
        </div>
      )}

      {activeTab === 'tech' && (
        <TechTree upgrades={techUpgrades} onPurchase={purchaseTech} upgradesList={TECHNICAL_UPGRADES} />
      )}

      {activeTab === 'achievements' && (
        <Achievements achieved={achieved} achievementsList={ACHIEVEMENTS} />
      )}

      {activeTab === 'settings' && (
        <div className="kawaii-card max-w-md mx-auto">
          <h3 className="text-2xl font-black text-black mb-5 flex items-center gap-2">⚙️ Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-base font-bold text-black mb-2">💾 Save Management</label>
              <div className="flex gap-2">
                <button onClick={exportSave} className="kawaii-btn flex-1">📤 Export Save</button>
                <label className="kawaii-btn flex-1 text-center cursor-pointer">
                  📥 Import Save
                  <input type="file" accept=".json" className="hidden" onChange={importSave} />
                </label>
              </div>
            </div>
            <div>
              <button onClick={resetSave} className="kawaii-btn w-full bg-red-500 hover:bg-red-600 text-white font-black">🗑️ Reset Save (danger)</button>
            </div>
            <div className="text-base text-black bg-pink-50 p-4 rounded-xl border border-pink-200">
              <p><strong>Game version:</strong> 2</p>
              <p><strong>Prestige points:</strong> {prestigePoints}</p>
              <p><strong>Production bonus:</strong> +{prestigeBonus}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Event Log */}
      <div className="mt-8 mb-8">
        <h2 className="text-2xl font-black text-black mb-3 flex items-center gap-2 justify-center">📜 Event Log</h2>
        <EventLog entries={log} />
      </div>

      <footer className="text-center text-black text-lg font-bold">
        <p>✨ Auto-save every 10s. Close anytime; return to resume. ✨</p>
      </footer>
    </div>
  );
}
