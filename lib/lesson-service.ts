import { createClient } from '@/lib/supabase'

export interface LessonData {
  id?: string
  title: string
  description?: string
  curriculum_id?: string
  type: 'conversation' | 'pronunciation' | 'vocabulary' | 'grammar' | 'review'
  lesson_type?: string
  difficulty: 'beginner' | 'elementary' | 'intermediate' | 'advanced'
  estimated_minutes: number
  character_id?: string
  objectives?: string[]
  key_phrases?: KeyPhrase[]
  dialogues?: Dialogue[]
  vocabulary_questions?: VocabularyQuestion[]
  listening_exercises?: ListeningExercise[]
  application_practice?: ApplicationPractice[]
  scenario?: ConversationScenario
  grammar_points?: GrammarPoint[]
  grammar_points_json?: GrammarPoint[]
  pronunciation_focus?: PronunciationFocus
  is_active?: boolean
  metadata?: any
  ai_conversation_system_prompt?: string
  ai_conversation_display_name?: string
  ai_conversation_display_description?: string
  ai_conversation_voice_model?: string
  order_index?: number
  created_at?: string
  updated_at?: string
}

export interface KeyPhrase {
  phrase: string
  meaning: string
  phonetic?: string
  audio_url?: string
  usage?: string
  examples?: string[]
  emotion?: string        // 感情表現フィールド
  tts_model?: string      // TTSモデル選択フィールド
  voice?: string          // 音声選択フィールド
}

export interface Dialogue {
  speaker: string            // 任意の文字列（Tom, Ken, AI, Userなど）
  text: string
  japanese?: string          // 日本語翻訳（translationからjapaneseに変更）
  translation?: string       // 互換性用（既存データ対応）
  audio_url?: string
  emotion?: string          // 感情表現（friendly, polite, happy等）
  voice?: string            // 音声選択（nova, fable, onyx等）
  tts_model?: string        // TTSモデル（gpt-4o-mini-tts等）
}

export interface VocabularyQuestion {
  question: string          // 問題の単語（アプリ側に合わせて「word」→「question」）
  options: string[]         // 選択肢
  correct_answer: number    // 正解のインデックス（文字列→数値）
  explanation?: string      // 解説（「hint」→「explanation」）
  audio_url?: string        // 音声URL（アプリ側と一致）
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface ListeningExercise {
  type: 'comprehension' | 'dictation' | 'translation'
  audio_text: string
  audio_url?: string
  questions?: {
    question: string
    options: string[]
    correct_answer: string
  }[]
  hints?: string[]
}

export interface ApplicationPractice {
  prompt: string
  syntax_hint?: string
  sample_answer?: string
}

export interface ConversationScenario {
  situation: string
  location: string
  aiRole: string
  userRole: string
  context: string
  suggestedTopics: string[]
}

export interface GrammarPoint {
  name: string
  explanation: string
  structure: string
  examples: string[]
  commonMistakes?: string[]
}

export interface PronunciationFocus {
  targetSounds: string[]
  words: string[]
  sentences: string[]
  tips?: string[]
}

class LessonService {
  private supabase = createClient()

  async getLessons(curriculumId?: string) {
    let query = this.supabase
      .from('lessons')
      .select(`
        *,
        curriculums (
          id,
          title
        )
      `)
      .order('order_index', { ascending: true })

    if (curriculumId) {
      query = query.eq('curriculum_id', curriculumId)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  async getLesson(id: string): Promise<LessonData> {
    const { data, error } = await this.supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return this.normalizeLesson(data)
  }

  async createLesson(lesson: Omit<LessonData, 'id' | 'created_at' | 'updated_at'>): Promise<LessonData> {
    const normalizedData = this.prepareForDatabase(lesson)
    
    const { data, error } = await this.supabase
      .from('lessons')
      .insert(normalizedData)
      .select()
      .single()

    if (error) throw error
    return this.normalizeLesson(data)
  }

  async updateLesson(id: string, lesson: Partial<LessonData>): Promise<LessonData> {
    const normalizedData = this.prepareForDatabase(lesson)
    normalizedData.updated_at = new Date().toISOString()

    const { data, error } = await this.supabase
      .from('lessons')
      .update(normalizedData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return this.normalizeLesson(data)
  }

  async deleteLesson(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('lessons')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async duplicateLesson(id: string, newTitle?: string): Promise<LessonData> {
    const original = await this.getLesson(id)
    
    const duplicate = {
      ...original,
      title: newTitle || `${original.title} (コピー)`,
      is_active: false
    }

    delete duplicate.id
    delete duplicate.created_at
    delete duplicate.updated_at

    return this.createLesson(duplicate)
  }

  async reorderLessons(lessonIds: string[]): Promise<void> {
    const updates = lessonIds.map((id, index) => ({
      id,
      order_index: index
    }))

    for (const update of updates) {
      const { error } = await this.supabase
        .from('lessons')
        .update({ order_index: update.order_index })
        .eq('id', update.id)

      if (error) throw error
    }
  }

  async validateLesson(lesson: LessonData): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // 必須フィールドのチェック
    if (!lesson.title?.trim()) {
      errors.push('タイトルは必須です')
    }

    if (!lesson.type) {
      errors.push('レッスンタイプは必須です')
    }

    if (!lesson.difficulty) {
      errors.push('難易度は必須です')
    }

    // コンテンツのチェック
    const hasKeyPhrases = lesson.key_phrases && lesson.key_phrases.length > 0
    const hasDialogues = lesson.dialogues && lesson.dialogues.length > 0
    const hasVocabulary = lesson.vocabulary_questions && lesson.vocabulary_questions.length > 0
    const hasGrammar = lesson.grammar_points && lesson.grammar_points.length > 0

    if (!hasKeyPhrases && !hasDialogues && !hasVocabulary && !hasGrammar) {
      warnings.push('レッスンにコンテンツが含まれていません')
    }

    // AI会話設定のチェック
    if (lesson.type === 'conversation' && !lesson.scenario?.situation) {
      warnings.push('会話レッスンにはシナリオ設定を推奨します')
    }

    // キーフレーズの検証
    if (hasKeyPhrases) {
      lesson.key_phrases!.forEach((kp, index) => {
        if (!kp.phrase.trim()) {
          errors.push(`キーフレーズ${index + 1}のフレーズが空です`)
        }
        if (!kp.meaning.trim()) {
          warnings.push(`キーフレーズ${index + 1}の意味が空です`)
        }
      })
    }

    // ダイアログの検証
    if (hasDialogues) {
      lesson.dialogues!.forEach((d, index) => {
        if (!d.text.trim()) {
          errors.push(`ダイアログ${index + 1}のテキストが空です`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  async bulkUpdateLessons(updates: Array<{ id: string; changes: Partial<LessonData> }>): Promise<void> {
    for (const { id, changes } of updates) {
      await this.updateLesson(id, changes)
    }
  }

  async searchLessons(query: string): Promise<LessonData[]> {
    const { data, error } = await this.supabase
      .from('lessons')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data.map(this.normalizeLesson)
  }

  async getLessonStats(id: string): Promise<{
    completionRate: number
    averageScore: number
    totalAttempts: number
  }> {
    const { data, error } = await this.supabase
      .from('user_lesson_progress')
      .select('status, best_score, attempts_count')
      .eq('lesson_id', id)

    if (error) throw error

    const total = data?.length || 0
    const completed = data?.filter(d => d.status === 'completed').length || 0
    const totalScore = data?.reduce((sum, d) => sum + (d.best_score || 0), 0) || 0
    const totalAttempts = data?.reduce((sum, d) => sum + (d.attempts_count || 0), 0) || 0

    return {
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      averageScore: total > 0 ? totalScore / total : 0,
      totalAttempts
    }
  }

  async exportLesson(id: string): Promise<string> {
    const lesson = await this.getLesson(id)
    return JSON.stringify(lesson, null, 2)
  }

  async importLesson(jsonData: string, curriculumId?: string): Promise<LessonData> {
    const lesson = JSON.parse(jsonData) as LessonData
    
    delete lesson.id
    delete lesson.created_at
    delete lesson.updated_at
    
    if (curriculumId) {
      lesson.curriculum_id = curriculumId
    }

    return this.createLesson(lesson)
  }

  private normalizeLesson(data: any): LessonData {
    return {
      ...data,
      type: data.type || data.lesson_type || 'conversation',
      grammar_points: data.grammar_points || data.grammar_points_json || [],
      key_phrases: this.normalizeKeyPhrases(data.key_phrases),
      dialogues: this.normalizeDialogues(data.dialogues),
      vocabulary_questions: this.normalizeVocabularyQuestions(data.vocabulary_questions),
      pronunciation_focus: this.normalizePronunciationFocus(data.pronunciation_focus)
    }
  }

  private normalizeKeyPhrases(keyPhrases: any): KeyPhrase[] {
    if (!keyPhrases) return []
    if (!Array.isArray(keyPhrases)) return []
    
    return keyPhrases.filter(kp => kp && typeof kp === 'object').map(kp => ({
      phrase: kp.phrase || '',
      meaning: kp.meaning || '',
      phonetic: kp.phonetic || kp.pronunciation,
      emotion: kp.emotion,
      voice: kp.voice,
      tts_model: kp.tts_model,
      audio_url: kp.audio_url,
      usage: kp.usage,
      examples: Array.isArray(kp.examples) ? kp.examples : []
    }))
  }

  private normalizeDialogues(dialogues: any): Dialogue[] {
    if (!dialogues) return []
    if (!Array.isArray(dialogues)) return []
    
    return dialogues.filter(d => d && typeof d === 'object').map(d => ({
      speaker: d.speaker || 'ai',
      text: d.text || '',
      japanese: d.japanese || d.translation,
      emotion: d.emotion,
      voice: d.voice,
      tts_model: d.tts_model,
      audio_url: d.audio_url
    }))
  }

  private normalizeVocabularyQuestions(questions: any): VocabularyQuestion[] {
    if (!questions) return []
    if (!Array.isArray(questions)) return []
    
    return questions.filter(q => q && typeof q === 'object').map(q => ({
      question: q.question || q.word || '',
      options: Array.isArray(q.options) ? q.options : [],
      correct_answer: typeof q.correct_answer === 'number' ? q.correct_answer : 0,
      explanation: q.explanation || q.hint,
      audio_url: q.audio_url,
      difficulty: q.difficulty
    }))
  }

  private normalizePronunciationFocus(focus: any): PronunciationFocus | undefined {
    if (!focus || typeof focus !== 'object') return undefined
    if (Array.isArray(focus) && focus.length === 0) return undefined
    
    return {
      targetSounds: Array.isArray(focus.targetSounds) ? focus.targetSounds : [],
      words: Array.isArray(focus.words) ? focus.words : [],
      sentences: Array.isArray(focus.sentences) ? focus.sentences : [],
      tips: Array.isArray(focus.tips) ? focus.tips : []
    }
  }

  private prepareForDatabase(lesson: Partial<LessonData>): any {
    const data: any = { ...lesson }

    // lesson_typeとの互換性
    if (data.type) {
      data.lesson_type = data.type
    }

    // grammar_points_jsonとの互換性
    if (data.grammar_points) {
      data.grammar_points_json = data.grammar_points
    }

    // 空配列をnullに変換
    const arrayFields = [
      'objectives', 'key_phrases', 'dialogues', 
      'vocabulary_questions', 'listening_exercises',
      'application_practice', 'grammar_points'
    ]

    arrayFields.forEach(field => {
      if (Array.isArray(data[field]) && data[field].length === 0) {
        data[field] = null
      }
    })

    // pronunciation_focusの処理
    if (data.pronunciation_focus) {
      const pf = data.pronunciation_focus
      if (!pf.targetSounds?.length && !pf.words?.length && !pf.sentences?.length) {
        data.pronunciation_focus = null
      }
    }

    // scenarioの処理
    if (data.scenario && data.type !== 'conversation') {
      data.scenario = null
    }

    return data
  }
}

export const lessonService = new LessonService()