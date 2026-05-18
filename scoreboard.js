// scoreboard.js — Swanky Cheese Beat Maker
// Top 20 displayed; full history retained. Persists via localStorage.

const Scoreboard = (() => {
  const KEY = 'swankycheese_scoreboard_v1';
  const TOP_SIZE = 20;

  function _load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { top20: [], history: [] };
    } catch { return { top20: [], history: [] }; }
  }

  function _save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  // Sort comparator: higher rawScore wins, then more ptsAwarded (streak bonus),
  // then earlier timestamp (first to achieve beats latecomers on ties).
  function _cmp(a, b) {
    if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
    if (b.ptsAwarded !== a.ptsAwarded) return b.ptsAwarded - a.ptsAwarded;
    return a.timestamp - b.timestamp;
  }

  // Check whether a beat with this rawScore/ptsAwarded would make top 20.
  // Returns { qualifies: bool, rank: number|null }
  function tryAdd(rawScore, ptsAwarded) {
    const { top20 } = _load();

    // If board isn't full yet, it always qualifies.
    if (top20.length < TOP_SIZE) {
      const hypothetical = { rawScore, ptsAwarded, timestamp: Date.now() };
      const rank = [...top20, hypothetical].sort(_cmp).findIndex(e => e === hypothetical) + 1;
      return { qualifies: true, rank };
    }

    // Compare against the worst entry currently in the top 20.
    const worst = [...top20].sort(_cmp)[TOP_SIZE - 1];
    if (rawScore < worst.rawScore) return { qualifies: false, rank: null };
    if (rawScore === worst.rawScore && ptsAwarded <= worst.ptsAwarded) return { qualifies: false, rank: null };

    const hypothetical = { rawScore, ptsAwarded, timestamp: Date.now() };
    const sorted = [...top20, hypothetical].sort(_cmp);
    const rank = sorted.findIndex(e => e === hypothetical) + 1;
    return { qualifies: rank <= TOP_SIZE, rank: rank <= TOP_SIZE ? rank : null };
  }

  // Build a serializable entry from current game state.
  // Call this right before showing the naming modal (captures live SLOTS / STATE).
  function buildEntry(name, grade, rawScore, ptsAwarded, slots, bpm, beatCount) {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: (name || '').trim() || 'Unnamed Beat',
      grade,
      rawScore,
      ptsAwarded,
      bpm,
      beatCount,
      slots: slots.map(s => ({
        instrument: s.instrument,
        note: s.note,
        octave: s.octave,
        pattern: Array.from(s.pattern),
      })),
      timestamp: Date.now(),
      date: new Date().toLocaleDateString(),
    };
  }

  // Persist an entry. Adds to history (full record) and top20 (trimmed to 20).
  // Returns the 1-based final rank in top20, or null if it didn't make it.
  function addEntry(entry) {
    const data = _load();

    // History is append-only; top20 is competitive.
    data.history.push({ ...entry });
    data.top20.push(entry);
    data.top20.sort(_cmp);
    if (data.top20.length > TOP_SIZE) data.top20.length = TOP_SIZE;

    _save(data);

    const rank = data.top20.findIndex(e => e.id === entry.id);
    return rank >= 0 ? rank + 1 : null;
  }

  function getTop20()   { return _load().top20; }
  function getHistory() { return _load().history; }
  function historyCount() { return _load().history.length; }

  return { tryAdd, buildEntry, addEntry, getTop20, getHistory, historyCount };
})();
