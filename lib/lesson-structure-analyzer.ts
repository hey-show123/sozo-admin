// 初級「自分について話す」カリキュラムの標準データ構造定義
// この構造を基準として他のカリキュラムのデータ構造を合わせる

export interface StandardKeyPhrase {
  phrase: string          // 英語フレーズ
  meaning: string         // 日本語の意味
  phonetic: string        // 発音記号
  audio_url: string | null // 音声ファイルURL
}

export interface StandardVocabularyQuestion {
  question: string        // 問題となる英語の単語・フレーズ
  options: string[]       // 選択肢（日本語）
  correct_answer: number  // 正解のインデックス（0から始まる）
  explanation: string     // 解説
}

export interface StandardDialogue {
  speaker: string         // 話者名
  text: string           // 英語のセリフ
  japanese: string       // 日本語訳
  audio: string | null   // 音声ファイルURL
}

export interface StandardLessonStructure {
  // 基本情報
  title: string
  description: string
  order_index: number
  lesson_type: 'conversation' | 'pronunciation' | 'vocabulary' | 'grammar' | 'review'
  difficulty: 'beginner' | 'elementary' | 'intermediate' | 'advanced'
  estimated_minutes: number

  // コンテンツ
  key_phrases: StandardKeyPhrase[]
  vocabulary_questions: StandardVocabularyQuestion[]
  dialogues: StandardDialogue[]
  
  // オプション
  objectives?: string[]
  ai_conversation_system_prompt?: string
  grammar_points_json?: any[]
  pronunciation_focus?: any
  application_practice?: any
  metadata?: any
}

export class LessonStructureAnalyzer {
  
  /**
   * 初級「自分について話す」の標準構造を取得
   */
  static getStandardStructure(): StandardLessonStructure {
    return {
      title: '',
      description: '',
      order_index: 0,
      lesson_type: 'conversation',
      difficulty: 'beginner',
      estimated_minutes: 30,
      key_phrases: [],
      vocabulary_questions: [],
      dialogues: [],
      objectives: [],
      ai_conversation_system_prompt: null
    }
  }

  /**
   * レッスンデータが標準構造に適合しているかチェック
   */
  static validateStructure(lesson: any): {
    isValid: boolean
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []

    // key_phrasesの構造チェック
    if (lesson.key_phrases && Array.isArray(lesson.key_phrases)) {
      lesson.key_phrases.forEach((kp: any, index: number) => {
        if (!kp.phrase || !kp.meaning) {
          issues.push(`key_phrases[${index}]: phrase と meaning は必須です`)
        }
        if (!kp.phonetic) {
          suggestions.push(`key_phrases[${index}]: phonetic フィールドの追加を推奨`)
        }
        if (kp.audio_url === undefined) {
          suggestions.push(`key_phrases[${index}]: audio_url フィールドの追加を推奨`)
        }
      })
    } else if (lesson.key_phrases === null) {
      // nullは問題なし（空のレッスンもあり得る）
    } else {
      issues.push('key_phrases: 配列またはnullである必要があります')
    }

    // vocabulary_questionsの構造チェック
    if (lesson.vocabulary_questions && Array.isArray(lesson.vocabulary_questions)) {
      lesson.vocabulary_questions.forEach((vq: any, index: number) => {
        if (!vq.question) {
          issues.push(`vocabulary_questions[${index}]: question は必須です`)
        }
        if (!Array.isArray(vq.options) || vq.options.length < 2) {
          issues.push(`vocabulary_questions[${index}]: options は2つ以上の配列である必要があります`)
        }
        if (typeof vq.correct_answer !== 'number') {
          issues.push(`vocabulary_questions[${index}]: correct_answer は数値である必要があります`)
        }
        if (!vq.explanation) {
          suggestions.push(`vocabulary_questions[${index}]: explanation の追加を推奨`)
        }
      })
    }

    // dialoguesの構造チェック
    if (lesson.dialogues && Array.isArray(lesson.dialogues)) {
      lesson.dialogues.forEach((d: any, index: number) => {
        if (!d.speaker || !d.text) {
          issues.push(`dialogues[${index}]: speaker と text は必須です`)
        }
        if (!d.japanese) {
          suggestions.push(`dialogues[${index}]: japanese フィールドの追加を推奨`)
        }
        if (d.audio === undefined) {
          suggestions.push(`dialogues[${index}]: audio フィールドの追加を推奨`)
        }
      })
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    }
  }

  /**
   * レッスンデータの構造差分を分析
   */
  static analyzeStructureDifferences(lesson: any): {
    missingFields: string[]
    extraFields: string[]
    structureDifferences: string[]
  } {
    const standard = this.getStandardStructure()
    const missingFields: string[] = []
    const extraFields: string[] = []
    const structureDifferences: string[] = []

    // 基本フィールドの確認
    const standardFields = Object.keys(standard)
    const lessonFields = Object.keys(lesson)

    standardFields.forEach(field => {
      if (!(field in lesson)) {
        missingFields.push(field)
      }
    })

    lessonFields.forEach(field => {
      if (!(field in standard)) {
        extraFields.push(field)
      }
    })

    // key_phrasesの構造詳細チェック
    if (lesson.key_phrases && Array.isArray(lesson.key_phrases) && lesson.key_phrases.length > 0) {
      const firstKeyPhrase = lesson.key_phrases[0]
      const standardKeyPhraseFields = ['phrase', 'meaning', 'phonetic', 'audio_url']
      
      standardKeyPhraseFields.forEach(field => {
        if (!(field in firstKeyPhrase)) {
          structureDifferences.push(`key_phrases.${field} フィールドが不足`)
        }
      })
    }

    // vocabulary_questionsの構造詳細チェック
    if (lesson.vocabulary_questions && Array.isArray(lesson.vocabulary_questions) && lesson.vocabulary_questions.length > 0) {
      const firstVQ = lesson.vocabulary_questions[0]
      const standardVQFields = ['question', 'options', 'correct_answer', 'explanation']
      
      standardVQFields.forEach(field => {
        if (!(field in firstVQ)) {
          structureDifferences.push(`vocabulary_questions.${field} フィールドが不足`)
        }
      })
    }

    // dialoguesの構造詳細チェック
    if (lesson.dialogues && Array.isArray(lesson.dialogues) && lesson.dialogues.length > 0) {
      const firstDialogue = lesson.dialogues[0]
      const standardDialogueFields = ['speaker', 'text', 'japanese', 'audio']
      
      standardDialogueFields.forEach(field => {
        if (!(field in firstDialogue)) {
          structureDifferences.push(`dialogues.${field} フィールドが不足`)
        }
      })
    }

    return {
      missingFields,
      extraFields,
      structureDifferences
    }
  }

  /**
   * レッスンデータを標準構造に変換するためのマイグレーション提案
   */
  static generateMigrationSuggestions(lesson: any): {
    sqlUpdates: string[]
    warnings: string[]
  } {
    const sqlUpdates: string[] = []
    const warnings: string[] = []
    
    const differences = this.analyzeStructureDifferences(lesson)
    
    // key_phrasesの修正提案
    if (lesson.key_phrases && Array.isArray(lesson.key_phrases)) {
      const needsPhoneticUpdate = lesson.key_phrases.some((kp: any) => !kp.phonetic)
      const needsAudioUrlUpdate = lesson.key_phrases.some((kp: any) => !('audio_url' in kp))
      
      if (needsPhoneticUpdate || needsAudioUrlUpdate) {
        sqlUpdates.push(`
          -- key_phrases構造を標準化
          UPDATE lessons 
          SET key_phrases = (
            SELECT jsonb_agg(
              CASE 
                WHEN item ? 'phonetic' AND item ? 'audio_url' THEN item
                ELSE item || jsonb_build_object(
                  'phonetic', COALESCE(item->>'phonetic', ''),
                  'audio_url', null
                )
              END
            )
            FROM jsonb_array_elements(key_phrases) AS item
          )
          WHERE id = '${lesson.id}';
        `)
      }
    }

    // vocabulary_questionsの修正提案
    if (lesson.vocabulary_questions && Array.isArray(lesson.vocabulary_questions)) {
      const needsExplanationUpdate = lesson.vocabulary_questions.some((vq: any) => !vq.explanation)
      
      if (needsExplanationUpdate) {
        sqlUpdates.push(`
          -- vocabulary_questions構造を標準化
          UPDATE lessons 
          SET vocabulary_questions = (
            SELECT jsonb_agg(
              CASE 
                WHEN item ? 'explanation' THEN item
                ELSE item || jsonb_build_object('explanation', '')
              END
            )
            FROM jsonb_array_elements(vocabulary_questions) AS item
          )
          WHERE id = '${lesson.id}';
        `)
      }
    }

    // dialoguesの修正提案
    if (lesson.dialogues && Array.isArray(lesson.dialogues)) {
      const needsJapaneseUpdate = lesson.dialogues.some((d: any) => !d.japanese)
      const needsAudioUpdate = lesson.dialogues.some((d: any) => !('audio' in d))
      
      if (needsJapaneseUpdate || needsAudioUpdate) {
        sqlUpdates.push(`
          -- dialogues構造を標準化
          UPDATE lessons 
          SET dialogues = (
            SELECT jsonb_agg(
              CASE 
                WHEN item ? 'japanese' AND item ? 'audio' THEN item
                ELSE item || jsonb_build_object(
                  'japanese', COALESCE(item->>'japanese', item->>'translation', ''),
                  'audio', null
                )
              END
            )
            FROM jsonb_array_elements(dialogues) AS item
          )
          WHERE id = '${lesson.id}';
        `)
      }
    }

    // objectivesの追加提案
    if (!lesson.objectives) {
      warnings.push('objectives フィールドの追加を検討してください')
    }

    // AI会話設定の追加提案
    if (!lesson.ai_conversation_system_prompt) {
      warnings.push('ai_conversation_system_prompt の追加を検討してください')
    }

    return {
      sqlUpdates,
      warnings
    }
  }

  /**
   * カリキュラム全体の構造統計を取得
   */
  static async analyzeCurriculumStructure(curriculumId: string, lessons: any[]): Promise<{
    totalLessons: number
    structureCompliance: number
    commonIssues: string[]
    migrationRequired: number
  }> {
    let compliantLessons = 0
    const allIssues: string[] = []
    let migrationRequired = 0

    lessons.forEach(lesson => {
      const validation = this.validateStructure(lesson)
      if (validation.isValid) {
        compliantLessons++
      } else {
        allIssues.push(...validation.issues)
        migrationRequired++
      }
    })

    // 共通の問題を集計
    const issueCount = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const commonIssues = Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => `${issue} (${count}件)`)

    return {
      totalLessons: lessons.length,
      structureCompliance: Math.round((compliantLessons / lessons.length) * 100),
      commonIssues,
      migrationRequired
    }
  }
}