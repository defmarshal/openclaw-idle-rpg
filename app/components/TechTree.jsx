'use client';

export default function TechTree({ upgrades, onPurchase, upgradesList }) {
  return (
    <div className="kawaii-card max-w-2xl mx-auto">
      <h3 className="text-2xl font-black text-purple-900 mb-6 flex items-center gap-3">🔧 Tech Tree</h3>
      <div className="grid gap-4">
        {upgradesList.map(tech => {
          const owned = upgrades.includes(tech.id);
          return (
            <div
              key={tech.id}
              className={`p-5 rounded-2xl border-2 transition-all ${
                owned
                  ? 'bg-green-100/90 border-green-400 shadow-md'
                  : 'bg-white/90 border-pink-400 hover:shadow-lg'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-black text-purple-900 text-lg">{tech.name}</div>
                  <div className="text-base text-pink-600 mt-1 font-bold">{tech.desc}</div>
                </div>
                {!owned ? (
                  <button
                    onClick={() => onPurchase(tech)}
                    className="kawaii-btn text-base px-5 py-2 font-black"
                  >
                    💖 Purchase
                  </button>
                ) : (
                  <span className="text-green-700 font-black flex items-center gap-2 text-lg">
                    <span>✔</span> Owned
                  </span>
                )}
              </div>
              <div className="text-base text-purple-700 mt-3 font-bold">
                Cost: {Object.entries(tech.cost).map(([k,v]) => `${v} ${k === 'memory' ? '💾' : k === 'cpu' ? '⚡' : k === 'tokens' ? '🔮' : k} ${v > 1 ? 'each' : ''}`).join(', ') || 'Free'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
