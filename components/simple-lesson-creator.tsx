'use client'

import React, { useState } from 'react'
import { Wand2, Eye, Download, Save, Sparkles, BookOpen } from 'lucide-react'
import { AutoLessonGenerator, SimpleTextInput, GeneratedLessonData } from '@/lib/auto-lesson-generator'
import { lessonService } from '@/lib/lesson-service'

interface SimpleLessonCreatorProps {
  curriculumId?: string
  onLessonCreated?: (lesson: any) => void
}

export default function SimpleLessonCreator({ curriculumId, onLessonCreated }: SimpleLessonCreatorProps) {
  const [input, setInput] = useState<SimpleTextInput>({
    title: '',
    description: '',
    topic: '',
    difficultyLevel: 'beginner',
    keyWords: [],
    japaneseContext: ''
  })
  
  const [generatedLesson, setGeneratedLesson] = useState<GeneratedLessonData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleInputChange = (field: keyof SimpleTextInput, value: any) => {
    setInput(prev => ({ ...prev, [field]: value }))
  }

  const handleGenerate = async () => {
    if (!input.topic.trim()) {
      alert('トピックを入力してください')
      return
    }

    setIsGenerating(true)
    try {
      const generated = await AutoLessonGenerator.generateFromText(input)
      setGeneratedLesson(generated)
      setShowPreview(true)
    } catch (error) {
      console.error('Generation failed:', error)
      alert('レッスン生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTemplateSelect = (templateName: string) => {
    const template = AutoLessonGenerator.generateFromTemplate(templateName)
    setInput(template)
  }

  const handleSave = async () => {
    if (!generatedLesson) return

    setIsSaving(true)
    try {
      const lessonData = {
        ...generatedLesson,
        curriculum_id: curriculumId || null,
        is_active: true,
        order_index: 0
      }

      const savedLesson = await lessonService.createLesson(lessonData)
      alert('レッスンを保存しました！')
      
      if (onLessonCreated) {
        onLessonCreated(savedLesson)
      }

      // フォームをリセット
      setInput({
        title: '',
        description: '',
        topic: '',
        difficultyLevel: 'beginner',
        keyWords: [],
        japaneseContext: ''
      })
      setGeneratedLesson(null)
      setShowPreview(false)

    } catch (error) {
      console.error('Save failed:', error)
      alert('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const downloadJSON = () => {
    if (!generatedLesson) return
    
    const blob = new Blob([JSON.stringify(generatedLesson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${generatedLesson.title.replace(/[^\w\s]/g, '')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center">
          <Sparkles className="h-6 w-6 mr-2 text-blue-500" />
          かんたんレッスン作成
        </h1>
        <p className="text-gray-600 mt-2">
          テキストを入力するだけで「初級：自分について話す」形式のレッスンが自動生成されます
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 入力フォーム */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            レッスン情報入力
          </h2>

          {/* テンプレート選択 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              テンプレートから選択（オプション）
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['自己紹介', '趣味について', '家族について', '仕事について'].map(template => (
                <button
                  key={template}
                  onClick={() => handleTemplateSelect(template)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                レッスンタイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={input.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: Lesson 1: 趣味について話す"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                トピック <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={input.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 趣味、家族、仕事、食べ物..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明文
              </label>
              <textarea
                value={input.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="レッスンの説明を入力（自動生成されます）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                難易度
              </label>
              <select
                value={input.difficultyLevel}
                onChange={(e) => handleInputChange('difficultyLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">初級</option>
                <option value="elementary">初中級</option>
                <option value="intermediate">中級</option>
                <option value="advanced">上級</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                キーワード（カンマ区切り）
              </label>
              <input
                type="text"
                value={input.keyWords?.join(', ') || ''}
                onChange={(e) => handleInputChange('keyWords', e.target.value.split(',').map(w => w.trim()).filter(w => w))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 好き, 楽しむ, スポーツ, 音楽"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日本語の文脈
              </label>
              <textarea
                value={input.japaneseContext}
                onChange={(e) => handleInputChange('japaneseContext', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="どのような場面で使う表現か（例: 友人との会話で自分の趣味を紹介する）"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !input.topic.trim()}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                  生成中...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  レッスンを自動生成
                </>
              )}
            </button>
          </div>
        </div>

        {/* プレビュー */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              生成プレビュー
            </h2>
            {generatedLesson && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {showPreview ? '詳細を隠す' : '詳細を表示'}
                </button>
                <button
                  onClick={downloadJSON}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center"
                >
                  <Download className="h-3 w-3 mr-1" />
                  JSON
                </button>
              </div>
            )}
          </div>

          {!generatedLesson ? (
            <div className="text-center py-12 text-gray-500">
              <Wand2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>左側でトピックを入力して<br />「レッスンを自動生成」をクリックしてください</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 基本情報 */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium text-blue-900">{generatedLesson.title}</h3>
                <p className="text-sm text-blue-700 mt-1">{generatedLesson.description}</p>
                <div className="flex items-center mt-2 text-xs text-blue-600">
                  <span className="bg-blue-200 px-2 py-1 rounded">{generatedLesson.difficulty}</span>
                  <span className="ml-2">{generatedLesson.estimated_minutes}分</span>
                </div>
              </div>

              {/* 統計 */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-lg font-bold text-green-600">{generatedLesson.key_phrases.length}</div>
                  <div className="text-xs text-green-700">キーフレーズ</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-lg font-bold text-purple-600">{generatedLesson.vocabulary_questions.length}</div>
                  <div className="text-xs text-purple-700">語彙問題</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="text-lg font-bold text-orange-600">{generatedLesson.dialogues.length}</div>
                  <div className="text-xs text-orange-700">ダイアログ</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded">
                  <div className="text-lg font-bold text-indigo-600">{generatedLesson.application_practice.length}</div>
                  <div className="text-xs text-indigo-700">応用問題</div>
                </div>
              </div>

              {showPreview && (
                <div className="space-y-4 border-t pt-4">
                  {/* キーフレーズサンプル */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">キーフレーズ（サンプル）</h4>
                    <div className="space-y-2">
                      {generatedLesson.key_phrases.slice(0, 2).map((phrase, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                          <div className="font-medium">{phrase.phrase}</div>
                          <div className="text-gray-600">{phrase.meaning}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 応用問題サンプル */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">応用問題（サンプル）</h4>
                    <div className="space-y-2">
                      {generatedLesson.application_practice.slice(0, 2).map((practice, index) => (
                        <div key={index} className="bg-indigo-50 p-3 rounded text-sm">
                          <div className="font-medium text-indigo-900">{practice.prompt}</div>
                          <div className="text-indigo-700 text-xs mt-1">ヒント: {practice.syntax_hint}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 学習目標 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">学習目標</h4>
                    <ul className="text-sm space-y-1">
                      {generatedLesson.objectives.map((obj, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 保存ボタン */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    レッスンを保存
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}