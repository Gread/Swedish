import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MAX_LEVEL = 4

/** Opacidade da cena por nível: 4 = totalmente visível, 0 = aprendida (some). */
export const LEVEL_OPACITY = [0, 0.18, 0.4, 0.65, 1] as const

export interface CardProgress {
  built: boolean
  nivelOpacidade: number
  ultimaRevisao: number | null
  streakCertos: number
}

const fresh = (): CardProgress => ({
  built: false,
  nivelOpacidade: MAX_LEVEL,
  ultimaRevisao: null,
  streakCertos: 0,
})

/** Nível 0 (aprendida) só volta pra fila depois deste intervalo. */
const LEARNED_REVIEW_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000

interface ProgressState {
  cards: Record<string, CardProgress>
  markBuilt: (id: string) => void
  answer: (id: string, correct: boolean) => void
  get: (id: string) => CardProgress
  isDue: (id: string, now?: number) => boolean
  reset: () => void
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      cards: {},
      markBuilt: (id) =>
        set((s) => ({ cards: { ...s.cards, [id]: { ...(s.cards[id] ?? fresh()), built: true } } })),
      answer: (id, correct) =>
        set((s) => {
          const p = s.cards[id] ?? fresh()
          return {
            cards: {
              ...s.cards,
              [id]: {
                ...p,
                nivelOpacidade: correct ? Math.max(0, p.nivelOpacidade - 1) : MAX_LEVEL,
                streakCertos: correct ? p.streakCertos + 1 : 0,
                ultimaRevisao: Date.now(),
              },
            },
          }
        }),
      get: (id) => get().cards[id] ?? fresh(),
      isDue: (id, now = Date.now()) => {
        const p = get().cards[id] ?? fresh()
        if (!p.built) return false
        if (p.nivelOpacidade > 0) return true
        return p.ultimaRevisao === null || now - p.ultimaRevisao > LEARNED_REVIEW_INTERVAL_MS
      },
      reset: () => set({ cards: {} }),
    }),
    { name: 'swedish-progress' },
  ),
)
