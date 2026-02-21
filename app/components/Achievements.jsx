'use client';

export default function Achievements({ achieved, achievementsList }) {
  return (
    <div className="kawaii-card max-w-2xl mx-auto">
      <h3 className="text-2xl font-black text-purple-900 mb-6 flex items-center gap-3">🏆 Achievements</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {achievementsList.map(a => {
          const isDone = achieved.includes(a.id);
          return (
            <div
              key={a.id}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${
                isDone
                  ? 'bg-yellow-100/90 border-yellow-400 shadow-lg scale-105'
                  : 'bg-white/70 border-pink-300 opacity-75'
              }`}
            >
              <div className="text-4xl mb-2">{isDone ? '🌟' : '☆'}</div>
              <div className="font-black text-purple-900 text-lg">{a.name}</div>
              <div className="text-base text-pink-600 mt-2 font-bold">{a.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
