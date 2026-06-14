'use client'

import useFeedback from '@/hooks/use-feedback'

interface FeedbackLinkProps {
  className?: string
  label: string
}

export default function FeedbackLink({ className, label }: FeedbackLinkProps) {
  const { getFeedbackUrl } = useFeedback()

  return (
    <button
      className={className}
      type='button'
      onClick={() => getFeedbackUrl()}
    >
      {label}
    </button>
  )
}
