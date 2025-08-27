'use client'

export const dynamic = 'force-dynamic'

import SimpleLessonCreator from '@/components/simple-lesson-creator'

export default function QuickCreateSimplePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SimpleLessonCreator />
    </div>
  )
}