.pragma library

// Mirrors src/store/progress.ts: a learned card (level 0) comes back for
// review after three days.
var MAX_LEVEL = 4
var LEARNED_REVIEW_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000

function parseCards(text) {
  try {
    var data = JSON.parse(text)
    return data && data.cards instanceof Array ? data.cards : []
  } catch (e) {
    return []
  }
}

// Labels for the decks: { temas: { code: name }, niveis: { 1: name } }.
function parseLabels(text) {
  try {
    var data = JSON.parse(text)
    return { temas: data.temas || {}, niveis: data.niveis || {} }
  } catch (e) {
    return { temas: {}, niveis: {} }
  }
}

// The app's persisted zustand store: { state: { cards: { id: progress } } }.
function parseProgress(text) {
  try {
    var data = JSON.parse(text)
    return data && data.state && data.state.cards ? data.state.cards : {}
  } catch (e) {
    return {}
  }
}

function parseDays(text) {
  try {
    var data = JSON.parse(text)
    return data && data.days instanceof Array ? data.days : []
  } catch (e) {
    return []
  }
}

function progressOf(progress, id) {
  var p = progress[id]
  return {
    built: !!(p && p.built),
    level: p && typeof p.nivelOpacidade === "number" ? p.nivelOpacidade : MAX_LEVEL,
    reviewedAt: p && p.ultimaRevisao ? p.ultimaRevisao : null,
    builtAt: p && p.builtAt ? p.builtAt : null
  }
}

function isDue(p, now) {
  if (!p.built) return false
  if (p.level > 0) return true
  return p.reviewedAt === null || now - p.reviewedAt > LEARNED_REVIEW_INTERVAL_MS
}

// "new" | "due" | "learning" | "learned"
function statusOf(p, now) {
  if (!p.built) return "new"
  if (isDue(p, now)) return p.level === 0 ? "due" : "learning"
  return "learned"
}

function startOfDay(now) {
  var d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function isoDay(time) {
  var d = new Date(time)
  var m = d.getMonth() + 1, day = d.getDate()
  return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day
}

function practisedToday(progress, now) {
  var midnight = startOfDay(now)
  for (var id in progress) {
    var p = progress[id]
    if ((p.builtAt || 0) >= midnight || (p.ultimaRevisao || 0) >= midnight) return true
  }
  return false
}

// Consecutive days with practice, ending today (or yesterday, while today is
// still open).
function streak(days, now) {
  var set = {}
  for (var i = 0; i < days.length; i++) set[days[i]] = true
  var day = startOfDay(now)
  if (!set[isoDay(day)]) day -= 86400000
  var count = 0
  while (set[isoDay(day)]) {
    count++
    day = startOfDay(day - 43200000) // half a day back absorbs DST shifts
  }
  return count
}

// Today's scene: the first card not built yet, in the app's order.
function sceneOfTheDay(cards, progress) {
  for (var i = 0; i < cards.length; i++) {
    if (!progressOf(progress, cards[i].id).built) return cards[i]
  }
  return null
}

function fold(text) {
  return String(text || "").toLowerCase()
    .replace(/[åä]/g, "a").replace(/ö/g, "o")
    .replace(/[áàâã]/g, "a").replace(/[éê]/g, "e").replace(/í/g, "i")
    .replace(/[óôõ]/g, "o").replace(/ú/g, "u").replace(/ç/g, "c")
}

// Cards matching the filter ("all" | "new" | "review" | "learned") and the
// search text (Portuguese or Swedish, accents ignored).
function visibleCards(cards, progress, filter, query, now) {
  var q = fold(query).trim()
  var out = []
  for (var i = 0; i < cards.length; i++) {
    var c = cards[i]
    var p = progressOf(progress, c.id)
    var status = statusOf(p, now)
    if (filter === "new" && status !== "new") continue
    if (filter === "review" && status !== "due" && status !== "learning") continue
    if (filter === "learned" && status !== "learned") continue
    if (q && fold(c.fraseFonte + " " + c.fraseAlvo + " " + c.contexto).indexOf(q) === -1) continue
    out.push({ card: c, status: status, level: p.level, built: p.built })
  }
  return out
}

function counts(cards, progress, now) {
  var due = 0, learned = 0, built = 0
  for (var i = 0; i < cards.length; i++) {
    var p = progressOf(progress, cards[i].id)
    if (p.built) built++
    var s = statusOf(p, now)
    if (s === "due" || s === "learning") due++
    if (s === "learned") learned++
  }
  return { total: cards.length, built: built, due: due, learned: learned }
}

// ---- Decks: lote, tema and nível. The saved choice lists what is switched
// OFF, so a deck that appears later (a new batch or theme) starts enabled.

function parseDecks(text) {
  var off = { lote: [], tema: [], nivel: [] }
  try {
    var data = JSON.parse(text)
    for (var k in off) if (data && data.off && data.off[k] instanceof Array) off[k] = data.off[k]
  } catch (e) {}
  return off
}

function isActive(card, off) {
  return off.lote.indexOf(card.lote) === -1
    && off.tema.indexOf(card.tema) === -1
    && off.nivel.indexOf(card.nivel) === -1
}

function activeCards(cards, off) {
  var out = []
  for (var i = 0; i < cards.length; i++) if (isActive(cards[i], off)) out.push(cards[i])
  return out
}

// Ids of the cards to review now, comma separated (for bin/swedish).
function dueIds(cards, progress, now) {
  var ids = []
  for (var i = 0; i < cards.length; i++) {
    if (isDue(progressOf(progress, cards[i].id), now)) ids.push(cards[i].id)
  }
  return ids.join(",")
}

// The decks of one kind with their card counts, in display order.
function deckList(cards, kind, labels) {
  var counts = {}, order = []
  for (var i = 0; i < cards.length; i++) {
    var v = cards[i][kind]
    if (v === undefined) continue
    if (!(v in counts)) { counts[v] = 0; order.push(v) }
    counts[v]++
  }
  if (kind !== "tema") order.sort(function(a, b) { return a - b })
  else if (labels) {
    var known = Object.keys(labels)
    order.sort(function(a, b) { return known.indexOf(a) - known.indexOf(b) })
  }
  return order.map(function(v) {
    var label = kind === "lote" ? "Lote " + v : (labels && labels[v]) || String(v)
    return { kind: kind, value: v, label: label, count: counts[v] }
  })
}

function toggled(off, kind, value) {
  var copy = { lote: off.lote.slice(), tema: off.tema.slice(), nivel: off.nivel.slice() }
  var list = copy[kind], at = list.indexOf(value)
  if (at === -1) list.push(value)
  else list.splice(at, 1)
  return copy
}
