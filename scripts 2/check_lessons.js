const { createClient } = require('@supabase/supabase-js')

// 環境変数を直接設定（Next.jsの.env.localから読み取る必要があります）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLessons() {
  try {
    console.log('=== カリキュラム一覧 ===')
    const { data: curriculums, error: curriculumsError } = await supabase
      .from('curriculums')
      .select('*')
      .order('created_at')

    if (curriculumsError) {
      console.error('カリキュラム取得エラー:', curriculumsError)
      return
    }

    curriculums?.forEach(c => {
      console.log(`ID: ${c.id}, タイトル: ${c.title}, 難易度: ${c.difficulty_level}`)
    })

    console.log('\n=== 各カリキュラムのレッスン ===')
    for (const curriculum of curriculums || []) {
      console.log(`\n--- ${curriculum.title} のレッスン ---`)
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, key_phrases, vocabulary_questions, dialogues, application_practice')
        .eq('curriculum_id', curriculum.id)
        .order('order_index')

      if (lessonsError) {
        console.error('レッスン取得エラー:', lessonsError)
        continue
      }

      if (lessons && lessons.length > 0) {
        lessons.forEach(lesson => {
          console.log(`  レッスン: ${lesson.title}`)
          console.log(`    キーフレーズ数: ${lesson.key_phrases?.length || 0}`)
          console.log(`    語彙問題数: ${lesson.vocabulary_questions?.length || 0}`)
          console.log(`    ダイアログ数: ${lesson.dialogues?.length || 0}`)
          console.log(`    応用問題数: ${lesson.application_practice?.length || 0}`)
          
          if (lesson.key_phrases && lesson.key_phrases.length > 0) {
            const firstPhrase = lesson.key_phrases[0]
            if (firstPhrase && firstPhrase.phrase) {
              console.log(`    最初のキーフレーズ: ${firstPhrase.phrase} - ${firstPhrase.meaning}`)
            } else {
              console.log(`    最初のキーフレーズ: データが不完全`)
            }
          }
        })
      } else {
        console.log('  レッスンなし')
      }
    }
  } catch (error) {
    console.error('エラー:', error)
  }
}

checkLessons()