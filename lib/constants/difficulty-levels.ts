export const DIFFICULTY_LEVELS = {
  BEGINNER_1: { value: 1, label: '初級1', displayName: 'Beginner 1', color: 'bg-green-100 text-green-800' },
  BEGINNER_2: { value: 2, label: '初級2', displayName: 'Beginner 2', color: 'bg-green-200 text-green-900' },
  BEGINNER_3: { value: 3, label: '初級3', displayName: 'Beginner 3', color: 'bg-green-300 text-green-900' },
  INTERMEDIATE_1: { value: 4, label: '中級1', displayName: 'Intermediate 1', color: 'bg-yellow-100 text-yellow-800' },
  INTERMEDIATE_2: { value: 5, label: '中級2', displayName: 'Intermediate 2', color: 'bg-yellow-200 text-yellow-900' },
  INTERMEDIATE_3: { value: 6, label: '中級3', displayName: 'Intermediate 3', color: 'bg-yellow-300 text-yellow-900' },
  ADVANCED_1: { value: 7, label: '上級1', displayName: 'Advanced 1', color: 'bg-red-100 text-red-800' },
  ADVANCED_2: { value: 8, label: '上級2', displayName: 'Advanced 2', color: 'bg-red-200 text-red-900' },
  ADVANCED_3: { value: 9, label: '上級3', displayName: 'Advanced 3', color: 'bg-red-300 text-red-900' },
} as const

export type DifficultyLevelKey = keyof typeof DIFFICULTY_LEVELS
export type DifficultyLevelValue = typeof DIFFICULTY_LEVELS[DifficultyLevelKey]['value']

export const getDifficultyByValue = (value: number) => {
  return Object.values(DIFFICULTY_LEVELS).find(level => level.value === value) || null
}

export const getDifficultyLabel = (value: number): string => {
  const level = getDifficultyByValue(value)
  return level ? level.label : '未設定'
}

export const getDifficultyDisplayName = (value: number): string => {
  const level = getDifficultyByValue(value)
  return level ? level.displayName : 'Unknown'
}

export const getDifficultyColor = (value: number): string => {
  const level = getDifficultyByValue(value)
  return level ? level.color : 'bg-gray-100 text-gray-800'
}

export const DIFFICULTY_OPTIONS = Object.values(DIFFICULTY_LEVELS).map(level => ({
  value: level.value,
  label: `${level.label} (${level.displayName})`,
}))