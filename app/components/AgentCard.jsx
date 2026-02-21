export default function AgentCard({ agent, onUpgrade, resources, onUseAbility, abilityCooldown }) {
  const cost = Math.floor(10 * Math.pow(agent.costMultiplier, agent.level));
  const canAfford = resources >= cost;
  const rate = (agent.baseRate * agent.level).toFixed(2);
  const ability = agent.ability;
  const onCooldown = abilityCooldown > 0;
  const cooldownTotal = ability?.cooldown || 0;
  const cooldownPercent = cooldownTotal > 0 ? ((cooldownTotal - abilityCooldown) / cooldownTotal) * 100 : 0;

  return (
    <div className={`kawaii-card relative overflow-hidden ${onCooldown ? 'opacity-90' : 'ability-ready'}`}>
      {/* Kawaii decorations */}
      <div className="absolute -top-3 -right-3 text-yellow-400 text-2xl animate-sparkle drop-shadow">✦</div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-black text-purple-900">{agent.name}</h3>
        <span className="px-4 py-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full text-purple-900 font-extrabold text-lg shadow">
          Lv {agent.level}
        </span>
      </div>

      <div className="text-lg font-bold text-purple-800 mb-4 flex items-center justify-center gap-2">
        <span>⚡</span>
        <span>~{rate} resources/sec</span>
      </div>

      {/* Upgrade button */}
      <button
        onClick={() => canAfford && onUpgrade(agent.id)}
        disabled={!canAfford}
        className={`kawaii-btn w-full mb-4 text-xl font-black ${!canAfford ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <span className="flex items-center justify-center gap-3">
          <span>📈</span>
          <span>UPGRADE</span>
          <span>{cost} 💾</span>
        </span>
      </button>

      {/* Ability section */}
      {ability && (
        <div className="border-t-4 border-pink-400 pt-4 mt-2">
          <button
            onClick={() => onUseAbility()}
            disabled={onCooldown}
            title={ability.desc}
            className={`w-full py-3 rounded-full text-base font-black flex items-center justify-center gap-2 relative overflow-hidden transition-all ${
              onCooldown
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-xl hover:scale-105'
            }`}
          >
            {onCooldown && (
              <div className="absolute inset-0 bg-white/60" style={{ width: `${cooldownPercent}%` }} />
            )}
            <span className="relative z-10">{ability.name}</span>
            {onCooldown && <span className="relative z-10 text-sm">⏳ {(abilityCooldown/1000).toFixed(0)}s</span>}
            {!onCooldown && <span className="relative z-10 text-2xl">✨</span>}
          </button>
          <div className="text-sm text-purple-700 mt-3 text-center font-bold">{ability.desc}</div>
        </div>
      )}
    </div>
  );
}

