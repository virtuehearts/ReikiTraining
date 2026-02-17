const assert = require('assert');

function scoreMemoryItem(memory, query) {
  const now = Date.now();
  const queryTerms = query.toLowerCase().split(/\W+/).filter(Boolean);
  const haystack = `${memory.content} ${memory.tags || ''}`.toLowerCase();
  const matchCount = queryTerms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);
  const createdAtTs = memory.createdAt ? new Date(memory.createdAt).getTime() : now;
  const usedAtTs = memory.lastUsedAt ? new Date(memory.lastUsedAt).getTime() : createdAtTs;
  const recencyHours = Math.max(1, (now - usedAtTs) / (1000 * 60 * 60));
  const recencyScore = Math.max(1, 50 - Math.log(recencyHours));
  return (memory.pinned ? 200 : 0) + matchCount * 30 + recencyScore + Math.max(0, Math.min(100, memory.confidence || 60));
}

function isDedupeMatch(existing, incoming) {
  const one = new Set(existing.toLowerCase().split(/\W+/).filter(Boolean));
  const two = new Set(incoming.toLowerCase().split(/\W+/).filter(Boolean));
  const intersection = [...one].filter((x) => two.has(x)).length;
  return intersection / Math.max(one.size, two.size, 1) >= 0.7;
}

const pinned = { content: 'User prefers concise morning ritual steps', pinned: true, confidence: 40, createdAt: new Date().toISOString(), lastUsedAt: new Date().toISOString(), tags: 'ritual' };
const unpinned = { content: 'User goal is to maintain daily Reiki discipline', pinned: false, confidence: 80, createdAt: new Date().toISOString(), lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), tags: 'goal' };

assert(scoreMemoryItem(pinned, 'ritual morning') > scoreMemoryItem(unpinned, 'ritual morning'), 'Pinned memory should rank higher');
assert(isDedupeMatch('User prefers concise bullet responses', 'User prefers concise bullet responses in chats'), 'Near-duplicate should match');
assert(!isDedupeMatch('User likes reminders', 'Schedule a support call for tomorrow'), 'Different memories should not match');

console.log('memory tests passed');
