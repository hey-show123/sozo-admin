'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Database, ArrowRight, AlertCircle } from 'lucide-react'
import StructureAlignmentTool from '@/components/structure-alignment-tool'

interface Curriculum {
  id: string
  title: string
  description?: string
  level?: string
}

export default function StructureAlignmentPage() {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadCurriculums()
  }, [])

  const loadCurriculums = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('curriculums')
        .select(`
          id,
          title,
          description,
          level
        `)
        .order('title')

      if (fetchError) throw fetchError
      setCurriculums(data || [])
    } catch (err) {
      console.error('Error loading curriculums:', err)
      setError(err instanceof Error ? err.message : 'カリキュラムの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getStandardCurriculum = () => {
    return curriculums.find(c => c.title === '初級：自分について話す')
  }

  const getNonStandardCurriculums = () => {
    return curriculums.filter(c => c.title !== '初級：自分について話す')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">カリキュラムを読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">エラー</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Database className="h-6 w-6 mr-2" />
          データ構造標準化ツール
        </h1>
        <p className="mt-2 text-gray-600">
          初級「自分について話す」カリキュラムを基準として、他のカリキュラムのデータ構造を標準化します。
        </p>
      </div>

      {!selectedCurriculum ? (
        <div className="space-y-6">
          {/* 標準カリキュラムの表示 */}
          {getStandardCurriculum() && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                標準カリキュラム（基準）
              </h2>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h3 className="font-medium text-gray-900">{getStandardCurriculum()!.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{getStandardCurriculum()!.description}</p>
                <div className="mt-2 text-xs text-green-700">
                  このカリキュラムのデータ構造を基準として他のカリキュラムを標準化します
                </div>
              </div>
            </div>
          )}

          {/* 標準化対象カリキュラム一覧 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                標準化対象カリキュラム
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                分析・標準化を行うカリキュラムを選択してください
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {getNonStandardCurriculums().map((curriculum) => (
                <div key={curriculum.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{curriculum.title}</h3>
                      {curriculum.description && (
                        <p className="text-sm text-gray-600 mt-1">{curriculum.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedCurriculum(curriculum)}
                      className="ml-4 flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      分析開始
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {getNonStandardCurriculums().length === 0 && (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                標準化対象カリキュラムがありません
              </h3>
              <p className="text-gray-600">
                すべてのカリキュラムが標準構造に準拠しているか、カリキュラムが存在しません。
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* 戻るボタン */}
          <div className="flex items-center">
            <button
              onClick={() => setSelectedCurriculum(null)}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              ← カリキュラム一覧に戻る
            </button>
          </div>

          {/* 構造分析ツール */}
          <StructureAlignmentTool
            curriculumId={selectedCurriculum.id}
            curriculumTitle={selectedCurriculum.title}
          />
        </div>
      )}
    </div>
  )
}