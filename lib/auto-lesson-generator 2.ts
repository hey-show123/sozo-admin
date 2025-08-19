// 単純なテキストから「初級：自分について話す」形式のレッスンデータを自動生成

import { StandardKeyPhrase, StandardVocabularyQuestion, StandardDialogue } from './lesson-structure-analyzer'

export interface SimpleTextInput {
  title: string
  description?: string
  topic: string
  difficultyLevel?: 'beginner' | 'elementary' | 'intermediate' | 'advanced'
  keyWords?: string[]
  japaneseContext?: string
}

export interface StandardApplicationPractice {
  prompt: string            // 練習の指示・問題文
  syntax_hint: string       // 文法ヒント・構文パターン
  sample_answer: string     // 模範解答例
}

export interface GeneratedLessonData {
  title: string
  description: string
  lesson_type: 'conversation'
  difficulty: string
  estimated_minutes: number
  key_phrases: StandardKeyPhrase[]
  vocabulary_questions: StandardVocabularyQuestion[]
  dialogues: StandardDialogue[]
  application_practice: StandardApplicationPractice[]
  objectives: string[]
  ai_conversation_system_prompt: string
}

export class AutoLessonGenerator {
  
  /**
   * シンプルなテキスト入力から完全なレッスンデータを生成
   */
  static async generateFromText(input: SimpleTextInput): Promise<GeneratedLessonData> {
    
    // 基本情報の生成
    const basicInfo = this.generateBasicInfo(input)
    
    // キーフレーズの生成
    const keyPhrases = this.generateKeyPhrases(input)
    
    // 語彙問題の生成
    const vocabularyQuestions = this.generateVocabularyQuestions(input, keyPhrases)
    
    // ダイアログの生成
    const dialogues = this.generateDialogues(input, keyPhrases)
    
    // 応用問題の生成
    const applicationPractice = this.generateApplicationPractice(input, keyPhrases)
    
    // 学習目標の生成
    const objectives = this.generateObjectives(input)
    
    // AI会話プロンプトの生成
    const aiPrompt = this.generateAIPrompt(input)

    return {
      ...basicInfo,
      key_phrases: keyPhrases,
      vocabulary_questions: vocabularyQuestions,
      dialogues: dialogues,
      application_practice: applicationPractice,
      objectives: objectives,
      ai_conversation_system_prompt: aiPrompt
    }
  }

  /**
   * 基本情報の生成
   */
  private static generateBasicInfo(input: SimpleTextInput) {
    return {
      title: input.title || `Lesson: ${input.topic}について話す`,
      description: input.description || `${input.topic}に関する基本的な表現を学びます。自分の経験や意見を英語で表現する方法を練習します。`,
      lesson_type: 'conversation' as const,
      difficulty: input.difficultyLevel || 'beginner',
      estimated_minutes: 30
    }
  }

  /**
   * キーフレーズの生成（トピックベース）
   */
  private static generateKeyPhrases(input: SimpleTextInput): StandardKeyPhrase[] {
    const topicTemplates = this.getTopicTemplates(input.topic)
    
    return topicTemplates.map(template => ({
      phrase: template.english,
      meaning: template.japanese,
      phonetic: template.phonetic || '',
      audio_url: null
    }))
  }

  /**
   * トピック別のテンプレート取得
   */
  private static getTopicTemplates(topic: string): Array<{english: string, japanese: string, phonetic?: string}> {
    const templates: Record<string, Array<{english: string, japanese: string, phonetic?: string}>> = {
      '趣味': [
        { english: 'I like playing sports.', japanese: '私はスポーツをするのが好きです。', phonetic: '/aɪ laɪk ˈpleɪɪŋ spɔːrts/' },
        { english: 'My hobby is reading.', japanese: '私の趣味は読書です。', phonetic: '/maɪ ˈhɑbi ɪz ˈridɪŋ/' },
        { english: 'I enjoy listening to music.', japanese: '私は音楽を聴くのを楽しんでいます。', phonetic: '/aɪ ɪnˈdʒɔɪ ˈlɪsənɪŋ tu ˈmjuzɪk/' }
      ],
      '家族': [
        { english: 'I have two brothers.', japanese: '私には兄弟が2人います。', phonetic: '/aɪ hæv tu ˈbrʌðərz/' },
        { english: 'My family is very close.', japanese: '私の家族はとても仲が良いです。', phonetic: '/maɪ ˈfæməli ɪz ˈveri kloʊs/' },
        { english: 'I live with my parents.', japanese: '私は両親と住んでいます。', phonetic: '/aɪ lɪv wɪð maɪ ˈpɛrənts/' }
      ],
      '仕事': [
        { english: 'I work as a teacher.', japanese: '私は教師として働いています。', phonetic: '/aɪ wɜrk æz ə ˈtiʧər/' },
        { english: 'My job is interesting.', japanese: '私の仕事は興味深いです。', phonetic: '/maɪ dʒɑb ɪz ˈɪntrəstɪŋ/' },
        { english: 'I start work at 9 AM.', japanese: '私は午前9時に仕事を始めます。', phonetic: '/aɪ stɑrt wɜrk æt naɪn eɪ ɛm/' }
      ],
      '食べ物': [
        { english: 'I love Japanese food.', japanese: '私は日本料理が大好きです。', phonetic: '/aɪ lʌv ˌdʒæpəˈniz fud/' },
        { english: 'My favorite dish is sushi.', japanese: '私の好きな料理は寿司です。', phonetic: '/maɪ ˈfeɪvərɪt dɪʃ ɪz ˈsuʃi/' },
        { english: 'I cook dinner every day.', japanese: '私は毎日夕食を作ります。', phonetic: '/aɪ kʊk ˈdɪnər ˈɛvri deɪ/' }
      ],
      'default': [
        { english: 'I am interested in this topic.', japanese: '私はこのトピックに興味があります。', phonetic: '/aɪ æm ˈɪntrəstəd ɪn ðɪs ˈtɑpɪk/' },
        { english: 'Let me tell you about it.', japanese: 'それについてお話しします。', phonetic: '/lɛt mi tɛl ju əˈbaʊt ɪt/' },
        { english: 'This is important to me.', japanese: 'これは私にとって重要です。', phonetic: '/ðɪs ɪz ɪmˈpɔrtənt tu mi/' }
      ]
    }

    return templates[topic] || templates['default']
  }

  /**
   * 語彙問題の生成
   */
  private static generateVocabularyQuestions(input: SimpleTextInput, keyPhrases: StandardKeyPhrase[]): StandardVocabularyQuestion[] {
    const questions: StandardVocabularyQuestion[] = []
    
    // キーフレーズから語彙問題を生成
    keyPhrases.forEach((phrase, index) => {
      if (index < 5) { // 最大5問
        const words = phrase.phrase.split(' ')
        const targetWord = words.find(w => w.length > 3 && !['the', 'and', 'with', 'that'].includes(w.toLowerCase()))
        
        if (targetWord) {
          questions.push({
            question: targetWord.toLowerCase().replace(/[^\w]/g, ''),
            options: this.generateOptions(targetWord, input.topic),
            correct_answer: 0,
            explanation: `"${targetWord}" は「${this.translateWord(targetWord)}」を意味します。`
          })
        }
      }
    })

    // 不足分は一般的な語彙で補完
    while (questions.length < 5) {
      const commonWords = this.getCommonWordsForTopic(input.topic)
      const word = commonWords[questions.length % commonWords.length]
      questions.push({
        question: word.english,
        options: [word.japanese, ...this.getRandomJapaneseWords(3)],
        correct_answer: 0,
        explanation: `"${word.english}" は「${word.japanese}」を意味します。`
      })
    }

    return questions
  }

  /**
   * ダイアログの生成
   */
  private static generateDialogues(input: SimpleTextInput, keyPhrases: StandardKeyPhrase[]): StandardDialogue[] {
    const dialogues: StandardDialogue[] = []
    
    // 基本的な会話パターンを生成
    const conversationFlow = [
      {
        speaker: 'AI',
        text: `Tell me about your ${input.topic.toLowerCase()}.`,
        japanese: `あなたの${input.topic}について教えてください。`
      },
      {
        speaker: 'User',
        text: keyPhrases[0]?.phrase || `I enjoy ${input.topic.toLowerCase()}.`,
        japanese: keyPhrases[0]?.meaning || `私は${input.topic}を楽しんでいます。`
      },
      {
        speaker: 'AI',
        text: 'That sounds interesting! Can you tell me more?',
        japanese: 'それは興味深いですね！もっと教えてもらえますか？'
      },
      {
        speaker: 'User',
        text: keyPhrases[1]?.phrase || `It makes me happy.`,
        japanese: keyPhrases[1]?.meaning || 'それは私を幸せにします。'
      }
    ]

    return conversationFlow.map(conv => ({
      speaker: conv.speaker,
      text: conv.text,
      japanese: conv.japanese,
      audio: null
    }))
  }

  /**
   * 応用問題の生成
   */
  private static generateApplicationPractice(input: SimpleTextInput, keyPhrases: StandardKeyPhrase[]): StandardApplicationPractice[] {
    const practices: StandardApplicationPractice[] = []
    
    // トピック別の応用問題パターン
    const topicPatterns = this.getApplicationPatterns(input.topic)
    
    topicPatterns.forEach((pattern, index) => {
      const targetPhrase = keyPhrases[index % keyPhrases.length]?.phrase || `I like ${input.topic.toLowerCase()}.`
      
      practices.push({
        prompt: pattern.prompt.replace('{topic}', input.topic),
        syntax_hint: pattern.syntaxHint,
        sample_answer: targetPhrase
      })
    })

    return practices
  }

  /**
   * トピック別応用問題パターンの取得
   */
  private static getApplicationPatterns(topic: string): Array<{prompt: string, syntaxHint: string}> {
    const patterns: Record<string, Array<{prompt: string, syntaxHint: string}>> = {
      '趣味': [
        {
          prompt: '新しい友人にあなたの{topic}について詳しく説明してください。',
          syntaxHint: 'I enjoy + [動詞+ing] + because + [理由]'
        },
        {
          prompt: '相手の{topic}について質問し、会話を続けてください。',
          syntaxHint: 'What kind of + [名詞] + do you like? How often + [疑問文]?'
        },
        {
          prompt: '友人に一緒に{topic}を楽しむよう誘ってください。',
          syntaxHint: 'Would you like to + [動詞] + with me? How about + [提案]?'
        }
      ],
      '家族': [
        {
          prompt: 'あなたの{topic}について新しい同僚に紹介してください。',
          syntaxHint: 'I have + [数] + [家族構成] + who + [説明]'
        },
        {
          prompt: '家族の写真を見せながら、それぞれについて説明してください。',
          syntaxHint: 'This is my + [関係] + [名前]. He/She + [特徴・職業]'
        },
        {
          prompt: '家族との思い出について友人に話してください。',
          syntaxHint: 'We used to + [動詞] + together. My favorite memory is + [思い出]'
        }
      ],
      '仕事': [
        {
          prompt: 'パーティーで初対面の人にあなたの{topic}について説明してください。',
          syntaxHint: 'I work as + [職業] + at + [会社]. My job involves + [業務内容]'
        },
        {
          prompt: '仕事の大変さと楽しさについて友人に話してください。',
          syntaxHint: 'Sometimes it''s + [形容詞] + but I enjoy + [楽しい部分]'
        },
        {
          prompt: '転職を考えている友人にアドバイスをしてください。',
          syntaxHint: 'You should + [アドバイス]. It''s important to + [重要なこと]'
        }
      ],
      'default': [
        {
          prompt: '{topic}について相手に詳しく説明してください。',
          syntaxHint: 'Let me tell you about + [話題]. It''s + [説明]'
        },
        {
          prompt: '相手の意見や経験について質問してください。',
          syntaxHint: 'What do you think about + [話題]? Have you ever + [経験]?'
        },
        {
          prompt: 'あなたの意見や感想を述べてください。',
          syntaxHint: 'In my opinion, + [意見]. I think + [考え]'
        }
      ]
    }

    return patterns[topic] || patterns['default']
  }

  /**
   * 学習目標の生成
   */
  private static generateObjectives(input: SimpleTextInput): string[] {
    return [
      `${input.topic}について基本的な表現ができる`,
      `自分の経験や意見を簡潔に伝えることができる`,
      `${input.topic}に関する質問に答えることができる`,
      '相手の話に適切に反応することができる'
    ]
  }

  /**
   * AI会話プロンプトの生成
   */
  private static generateAIPrompt(input: SimpleTextInput): string {
    return `あなたは親しみやすい英語の先生です。生徒と${input.topic}について会話をしてください。

以下の点を心がけてください：
- 生徒の${input.topic}に関する話に興味を示す
- 簡単な質問をして会話を続ける
- 生徒の英語レベルに合わせて話す
- 励ましの言葉をかける
- 自然な会話の流れを作る

生徒が答えに困った時は、ヒントを出したり、例を示したりしてサポートしてください。`
  }

  /**
   * ヘルパーメソッド
   */
  private static generateOptions(targetWord: string, topic: string): string[] {
    const translation = this.translateWord(targetWord)
    const distractors = this.getRandomJapaneseWords(3)
    return [translation, ...distractors]
  }

  private static translateWord(word: string): string {
    const translations: Record<string, string> = {
      'like': '好き',
      'love': '愛する',
      'enjoy': '楽しむ',
      'interesting': '興味深い',
      'family': '家族',
      'work': '働く',
      'hobby': '趣味',
      'music': '音楽',
      'food': '食べ物',
      'important': '重要な',
      'happy': '幸せな',
      'playing': '遊ぶ',
      'reading': '読書',
      'listening': '聞く',
      'cooking': '料理'
    }
    return translations[word.toLowerCase()] || word
  }

  private static getRandomJapaneseWords(count: number): string[] {
    const words = ['美しい', '難しい', '簡単な', '大きな', '小さな', '新しい', '古い', '速い', '遅い', '高い', '安い', '良い', '悪い']
    return words.sort(() => Math.random() - 0.5).slice(0, count)
  }

  private static getCommonWordsForTopic(topic: string): Array<{english: string, japanese: string}> {
    const commonWords: Record<string, Array<{english: string, japanese: string}>> = {
      '趣味': [
        { english: 'hobby', japanese: '趣味' },
        { english: 'enjoy', japanese: '楽しむ' },
        { english: 'interesting', japanese: '興味深い' },
        { english: 'fun', japanese: '楽しい' },
        { english: 'activity', japanese: '活動' }
      ],
      '家族': [
        { english: 'family', japanese: '家族' },
        { english: 'parents', japanese: '両親' },
        { english: 'brother', japanese: '兄弟' },
        { english: 'sister', japanese: '姉妹' },
        { english: 'close', japanese: '親しい' }
      ],
      'default': [
        { english: 'like', japanese: '好き' },
        { english: 'good', japanese: '良い' },
        { english: 'important', japanese: '重要な' },
        { english: 'happy', japanese: '幸せな' },
        { english: 'nice', japanese: '素晴らしい' }
      ]
    }
    
    return commonWords[topic] || commonWords['default']
  }

  /**
   * プリセットテンプレートからの生成
   */
  static generateFromTemplate(templateName: string, customizations: Partial<SimpleTextInput> = {}): SimpleTextInput {
    const templates: Record<string, SimpleTextInput> = {
      '自己紹介': {
        title: 'Lesson: 自己紹介をする',
        description: '初対面の人に自分について紹介する基本的な表現を学びます',
        topic: '自己紹介',
        keyWords: ['名前', '出身', '職業', '趣味'],
        japaneseContext: '新しい人と会った時の基本的な自己紹介'
      },
      '趣味について': {
        title: 'Lesson: 趣味について話す',
        description: '自分の趣味や好きなことについて話す表現を学びます',
        topic: '趣味',
        keyWords: ['好き', '楽しむ', 'スポーツ', '音楽', '読書'],
        japaneseContext: '自分の興味や趣味について相手に伝える'
      },
      '家族について': {
        title: 'Lesson: 家族について話す',
        description: '家族構成や家族との関係について話す表現を学びます',
        topic: '家族',
        keyWords: ['家族', '両親', '兄弟', '姉妹', '仲良し'],
        japaneseContext: '自分の家族について紹介する'
      },
      '仕事について': {
        title: 'Lesson: 仕事について話す',
        description: '自分の職業や仕事内容について話す表現を学びます',
        topic: '仕事',
        keyWords: ['職業', '会社', '働く', '同僚', 'やりがい'],
        japaneseContext: '自分の仕事について説明する'
      }
    }

    const template = templates[templateName] || templates['自己紹介']
    return { ...template, ...customizations }
  }
}