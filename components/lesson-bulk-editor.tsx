'use client'

import React, { useState, useCallback } from 'react'
import { Check, X, Edit2, Copy, Trash2, Download, Upload, AlertCircle } from 'lucide-react'
import { LessonData, lessonService } from '@/lib/lesson-service'

interface LessonBulkEditorProps {
  lessons: LessonData[]
  onUpdate: () => void
}

export default function LessonBulkEditor({ lessons, onUpdate }: LessonBulkEditorProps) {
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [editingField, setEditingField] = useState<{ lessonId: string; field: string } | null>(null)
  const [tempValue, setTempValue] = useState<any>(null)

  const handleSelectAll = useCallback(() => {
    if (selectedLessons.size === lessons.length) {
      setSelectedLessons(new Set())
    } else {
      setSelectedLessons(new Set(lessons.map(l => l.id!)))
    }
  }, [lessons, selectedLessons.size])

  const handleSelectLesson = useCallback((lessonId: string) => {
    const newSelection = new Set(selectedLessons)
    if (newSelection.has(lessonId)) {
      newSelection.delete(lessonId)
    } else {
      newSelection.add(lessonId)
    }
    setSelectedLessons(newSelection)
  }, [selectedLessons])

  const handleBulkAction = useCallback(async () => {
    if (selectedLessons.size === 0) {
      alert('レッスンを選択してください')
      return
    }

    setIsProcessing(true)

    try {
      switch (bulkAction) {
        case 'activate':
          await lessonService.bulkUpdateLessons(
            Array.from(selectedLessons).map(id => ({
              id,
              changes: { is_active: true }
            }))
          )
          alert(`${selectedLessons.size}件のレッスンを有効化しました`)
          break

        case 'deactivate':
          await lessonService.bulkUpdateLessons(
            Array.from(selectedLessons).map(id => ({
              id,
              changes: { is_active: false }
            }))
          )
          alert(`${selectedLessons.size}件のレッスンを無効化しました`)
          break

        case 'delete':
          if (!confirm(`${selectedLessons.size}件のレッスンを削除しますか？`)) {
            return
          }
          for (const id of selectedLessons) {
            await lessonService.deleteLesson(id)
          }
          alert(`${selectedLessons.size}件のレッスンを削除しました`)
          break

        case 'export':
          const exportData = await Promise.all(
            Array.from(selectedLessons).map(id => 
              lessons.find(l => l.id === id)
            )
          )
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `lessons_export_${new Date().toISOString().split('T')[0]}.json`
          a.click()
          URL.revokeObjectURL(url)
          break

        default:
          break
      }

      setSelectedLessons(new Set())
      setBulkAction('')
      onUpdate()
    } catch (error) {
      console.error('Bulk action failed:', error)
      alert('一括操作に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }, [bulkAction, selectedLessons, lessons, onUpdate])

  const handleInlineEdit = useCallback((lessonId: string, field: string, currentValue: any) => {
    setEditingField({ lessonId, field })
    setTempValue(currentValue)
  }, [])

  const handleInlineUpdate = useCallback(async () => {
    if (!editingField) return

    setIsProcessing(true)
    try {
      await lessonService.updateLesson(editingField.lessonId, {
        [editingField.field]: tempValue
      })
      onUpdate()
    } catch (error) {
      console.error('Update failed:', error)
      alert('更新に失敗しました')
    } finally {
      setEditingField(null)
      setTempValue(null)
      setIsProcessing(false)
    }
  }, [editingField, tempValue, onUpdate])

  const handleCancelEdit = useCallback(() => {
    setEditingField(null)
    setTempValue(null)
  }, [])

  const handleDuplicateLesson = useCallback(async (lessonId: string) => {
    setIsProcessing(true)
    try {
      await lessonService.duplicateLesson(lessonId)
      alert('レッスンを複製しました')
      onUpdate()
    } catch (error) {
      console.error('Duplicate failed:', error)
      alert('複製に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }, [onUpdate])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'elementary': return 'bg-blue-100 text-blue-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'conversation': return '💬'
      case 'pronunciation': return '🗣️'
      case 'vocabulary': return '📖'
      case 'grammar': return '📝'
      case 'review': return '🔄'
      default: return '📚'
    }
  }

  return (
    <div className="space-y-4">
      {/* 一括操作バー */}
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
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="">アクションを選択</option>
                <option value="activate">有効化</option>
                <option value="deactivate">無効化</option>
                <option value="export">エクスポート</option>
                <option value="delete">削除</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction || isProcessing}
                className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                実行
              </button>
            </div>
          )}
        </div>
      </div>

      {/* レッスンテーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                選択
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                タイトル
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                タイプ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                難易度
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                コンテンツ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lessons.map((lesson) => {
              const hasKeyPhrases = (lesson.key_phrases?.length || 0) > 0
              const hasDialogues = (lesson.dialogues?.length || 0) > 0
              const hasVocabulary = (lesson.vocabulary_questions?.length || 0) > 0
              const hasGrammar = (lesson.grammar_points?.length || 0) > 0
              const contentCount = 
                (lesson.key_phrases?.length || 0) +
                (lesson.dialogues?.length || 0) +
                (lesson.vocabulary_questions?.length || 0) +
                (lesson.grammar_points?.length || 0)

              return (
                <tr key={lesson.id} className={selectedLessons.has(lesson.id!) ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedLessons.has(lesson.id!)}
                      onChange={() => handleSelectLesson(lesson.id!)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    {editingField?.lessonId === lesson.id && editingField?.field === 'title' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                          autoFocus
                        />
                        <button
                          onClick={handleInlineUpdate}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{lesson.title}</span>
                        <button
                          onClick={() => handleInlineEdit(lesson.id!, 'title', lesson.title)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {lesson.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                        {lesson.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-2xl" title={lesson.type}>
                      {getTypeIcon(lesson.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(lesson.difficulty)}`}>
                      {lesson.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {contentCount === 0 ? (
                        <span className="flex items-center text-xs text-red-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          コンテンツなし
                        </span>
                      ) : (
                        <>
                          {hasKeyPhrases && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              キー {lesson.key_phrases?.length}
                            </span>
                          )}
                          {hasDialogues && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              対話 {lesson.dialogues?.length}
                            </span>
                          )}
                          {hasVocabulary && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                              語彙 {lesson.vocabulary_questions?.length}
                            </span>
                          )}
                          {hasGrammar && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                              文法 {lesson.grammar_points?.length}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lesson.is_active}
                        onChange={async () => {
                          setIsProcessing(true)
                          try {
                            await lessonService.updateLesson(lesson.id!, {
                              is_active: !lesson.is_active
                            })
                            onUpdate()
                          } catch (error) {
                            console.error('Status update failed:', error)
                          } finally {
                            setIsProcessing(false)
                          }
                        }}
                        className="sr-only peer"
                        disabled={isProcessing}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDuplicateLesson(lesson.id!)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="複製"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          const json = await lessonService.exportLesson(lesson.id!)
                          const blob = new Blob([json], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `${lesson.title.replace(/\s+/g, '_')}.json`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="エクスポート"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('このレッスンを削除しますか？')) {
                            setIsProcessing(true)
                            try {
                              await lessonService.deleteLesson(lesson.id!)
                              onUpdate()
                            } catch (error) {
                              console.error('Delete failed:', error)
                              alert('削除に失敗しました')
                            } finally {
                              setIsProcessing(false)
                            }
                          }
                        }}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}