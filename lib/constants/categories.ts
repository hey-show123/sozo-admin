// カテゴリーの定義（美容師向けカテゴリー）
// アプリ側のlessons_list_screen_redesigned.dartと同じカテゴリーを使用
export const CURRICULUM_CATEGORIES = [
  { id: 'haircut', label: 'カット', value: 'haircut' },
  { id: 'coloring', label: 'カラーリング', value: 'coloring' },
  { id: 'perm', label: 'パーマ', value: 'perm' },
  { id: 'treatment', label: 'トリートメント', value: 'treatment' },
  { id: 'styling', label: 'スタイリング', value: 'styling' },
  { id: 'shampoo', label: 'シャンプー', value: 'shampoo' },
  { id: 'makeup', label: 'メイク', value: 'makeup' },
  { id: 'nail', label: 'ネイル', value: 'nail' },
  { id: 'esthetics', label: 'エステ', value: 'esthetics' },
  { id: 'reception', label: '接客', value: 'reception' },
] as const

export type CurriculumCategory = typeof CURRICULUM_CATEGORIES[number]['value']

// カテゴリーIDからラベルを取得するヘルパー関数
export function getCategoryLabel(categoryId: string): string {
  const category = CURRICULUM_CATEGORIES.find(cat => cat.value === categoryId)
  return category?.label || categoryId
}