export const DIFFICULTY_LEVELS = {
  BEGINNER_1: { value: 1, label: '初級 Beginner', displayName: '初級 Beginner', color: 'bg-green-100 text-green-800' },
  BEGINNER_2: { value: 2, label: '初級 Intermediate', displayName: '初級 Intermediate', color: 'bg-green-200 text-green-900' },
  BEGINNER_3: { value: 3, label: '初級 Advanced', displayName: '初級 Advanced', color: 'bg-green-300 text-green-900' },
  INTERMEDIATE_1: { value: 4, label: '中級 Beginner', displayName: '中級 Beginner', color: 'bg-yellow-100 text-yellow-800' },
  INTERMEDIATE_2: { value: 5, label: '中級 Intermediate', displayName: '中級 Intermediate', color: 'bg-yellow-200 text-yellow-900' },
  INTERMEDIATE_3: { value: 6, label: '中級 Advanced', displayName: '中級 Advanced', color: 'bg-yellow-300 text-yellow-900' },
  ADVANCED_1: { value: 7, label: '上級 Beginner', displayName: '上級 Beginner', color: 'bg-red-100 text-red-800' },
  ADVANCED_2: { value: 8, label: '上級 Intermediate', displayName: '上級 Intermediate', color: 'bg-red-200 text-red-900' },
  ADVANCED_3: { value: 9, label: '上級 Advanced', displayName: '上級 Advanced', color: 'bg-red-300 text-red-900' },
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
  label: level.label,
}))