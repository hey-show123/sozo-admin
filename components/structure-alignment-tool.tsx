'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Settings, Database, ArrowRight, Download } from 'lucide-react'
import { LessonStructureAnalyzer } from '@/lib/lesson-structure-analyzer'
import { lessonService } from '@/lib/lesson-service'

interface StructureAlignmentToolProps {
  curriculumId: string
  curriculumTitle: string
}

export default function StructureAlignmentTool({ curriculumId, curriculumTitle }: StructureAlignmentToolProps) {
  const [lessons, setLessons] = useState<any[]>([])
  const [analysis, setAnalysis] = useState<any>(null)
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set())
  const [migrationSuggestions, setMigrationSuggestions] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isMigrating, setIsMigrating] = useState(false)

  useEffect(() => {
    loadLessonsAndAnalyze()
  }, [curriculumId])

  const loadLessonsAndAnalyze = async () => {
    setIsLoading(true)
    try {
      const lessonData = await lessonService.getLessons(curriculumId)
      setLessons(lessonData)

      // 構造分析を実行
      const analysisResult = await LessonStructureAnalyzer.analyzeCurriculumStructure(
        curriculumId, 
        lessonData
      )
      setAnalysis(analysisResult)

      // 各レッスンのマイグレーション提案を生成
      const suggestions: Record<string, any> = {}
      lessonData.forEach(lesson => {
        const validation = LessonStructureAnalyzer.validateStructure(lesson)
        const migration = LessonStructureAnalyzer.generateMigrationSuggestions(lesson)
        const differences = LessonStructureAnalyzer.analyzeStructureDifferences(lesson)
        
        suggestions[lesson.id] = {
          validation,
          migration,
          differences
        }
      })
      setMigrationSuggestions(suggestions)

    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedLessons.size === lessons.length) {
      setSelectedLessons(new Set())
    } else {
      setSelectedLessons(new Set(lessons.map(l => l.id)))
    }
  }

  const handleSelectLesson = (lessonId: string) => {
    const newSelection = new Set(selectedLessons)
    if (newSelection.has(lessonId)) {
      newSelection.delete(lessonId)
    } else {
      newSelection.add(lessonId)
    }
    setSelectedLessons(newSelection)
  }

  const generateMigrationSQL = () => {
    const sqlStatements: string[] = []
    
    selectedLessons.forEach(lessonId => {
      const suggestion = migrationSuggestions[lessonId]
      if (suggestion?.migration.sqlUpdates.length > 0) {
        sqlStatements.push(...suggestion.migration.sqlUpdates)
      }
    })

    const fullSQL = `-- カリキュラム「${curriculumTitle}」の構造標準化マイグレーション
-- 生成日時: ${new Date().toLocaleString()}
-- 対象レッスン数: ${selectedLessons.size}

${sqlStatements.join('\n\n')}

-- 完了確認
SELECT 
  title,
  CASE WHEN key_phrases IS NOT NULL THEN jsonb_array_length(key_phrases) ELSE 0 END as key_phrases_count,
  CASE WHEN vocabulary_questions IS NOT NULL THEN jsonb_array_length(vocabulary_questions) ELSE 0 END as vocab_count,
  CASE WHEN dialogues IS NOT NULL THEN jsonb_array_length(dialogues) ELSE 0 END as dialogues_count
FROM lessons 
WHERE curriculum_id = '${curriculumId}'
ORDER BY order_index;`

    return fullSQL
  }

  const downloadMigrationSQL = () => {
    const sql = generateMigrationSQL()
    const blob = new Blob([sql], { type: 'text/sql' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${curriculumTitle.replace(/[^\w\s]/g, '')}_structure_migration.sql`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100'
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getIssueIcon = (validation: any) => {
    if (validation.isValid) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    return <AlertCircle className="h-5 w-5 text-red-500" />
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">構造分析中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 全体統計 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Database className="h-5 w-5 mr-2" />
            構造分析結果: {curriculumTitle}
          </h2>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getComplianceColor(analysis?.structureCompliance || 0)}`}>
              適合率: {analysis?.structureCompliance || 0}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{analysis?.totalLessons || 0}</div>
            <div className="text-sm text-gray-500">総レッスン数</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {analysis?.totalLessons - analysis?.migrationRequired || 0}
            </div>
            <div className="text-sm text-gray-500">標準準拠</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{analysis?.migrationRequired || 0}</div>
            <div className="text-sm text-gray-500">要修正</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{selectedLessons.size}</div>
            <div className="text-sm text-gray-500">選択中</div>
          </div>
        </div>

        {analysis?.commonIssues && analysis.commonIssues.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-2">共通の問題</h3>
            <ul className="space-y-1">
              {analysis.commonIssues.map((issue: string, index: number) => (
                <li key={index} className="text-sm text-gray-600 flex items-center">
                  <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 一括操作 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedLessons.size === lessons.length && lessons.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">
              {selectedLessons.size > 0 
                ? `${selectedLessons.size}件選択中`
                : '全て選択'
              }
            </span>
          </div>

          {selectedLessons.size > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={downloadMigrationSQL}
                className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
              >
                <Download className="h-4 w-4 mr-1" />
                マイグレーションSQL生成
              </button>
            </div>
          )}
        </div>
      </div>

      {/* レッスン一覧 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                選択
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                レッスン
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                構造状態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                データ統計
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                問題
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                マイグレーション
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lessons.map((lesson) => {
              const suggestion = migrationSuggestions[lesson.id]
              const validation = suggestion?.validation
              const differences = suggestion?.differences
              const migration = suggestion?.migration

              return (
                <tr key={lesson.id} className={selectedLessons.has(lesson.id) ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedLessons.has(lesson.id)}
                      onChange={() => handleSelectLesson(lesson.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                      {lesson.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {validation && getIssueIcon(validation)}
                      <span className={`ml-2 text-sm ${
                        validation?.isValid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {validation?.isValid ? '適合' : '要修正'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <div>キーフレーズ: {lesson.key_phrases ? JSON.parse(JSON.stringify(lesson.key_phrases)).length : 0}</div>
                      <div>語彙問題: {lesson.vocabulary_questions ? JSON.parse(JSON.stringify(lesson.vocabulary_questions)).length : 0}</div>
                      <div>ダイアログ: {lesson.dialogues ? JSON.parse(JSON.stringify(lesson.dialogues)).length : 0}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {validation?.issues && validation.issues.length > 0 ? (
                      <div className="text-xs text-red-600 space-y-1">
                        {validation.issues.slice(0, 2).map((issue: string, index: number) => (
                          <div key={index}>{issue}</div>
                        ))}
                        {validation.issues.length > 2 && (
                          <div>他 {validation.issues.length - 2} 件</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-green-600">問題なし</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {migration?.sqlUpdates && migration.sqlUpdates.length > 0 ? (
                      <div className="flex items-center text-xs text-blue-600">
                        <Settings className="h-3 w-3 mr-1" />
                        {migration.sqlUpdates.length} 件の修正
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">修正不要</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 標準構造の説明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          標準構造（初級「自分について話す」準拠）
        </h3>
        <div className="text-xs text-blue-800 space-y-1">
          <div><strong>key_phrases:</strong> phrase, meaning, phonetic, audio_url</div>
          <div><strong>vocabulary_questions:</strong> question, options, correct_answer, explanation</div>
          <div><strong>dialogues:</strong> speaker, text, japanese, audio</div>
          <div><strong>推奨フィールド:</strong> objectives, ai_conversation_system_prompt</div>
        </div>
      </div>
    </div>
  )
}