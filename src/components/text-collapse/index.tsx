'use client'
import { useI18n } from '@/i18n'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import styles from './index.module.css'

interface AdvancedTextCollapseProps {
  text: string
  expandText?: string
  collapseText?: string
  textClassName?: string
  textColor?: string
  buttonColor?: string
  backgroundColor?: string
  onExpand?: () => void
  onCollapse?: () => void
}

const AdvancedTextCollapse: React.FC<AdvancedTextCollapseProps> = ({
  text,
  textClassName,
  onExpand,
  onCollapse,
}) => {
  const { t } = useI18n()
  const merchant = useRef<HTMLDivElement>(null)
  const [showCompleteDesc, setShowCompleteDesc] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const showTotalIntro = useCallback(() => {
    setShowCompleteDesc(!showCompleteDesc)
  }, [showCompleteDesc])

  useEffect(() => {
    setTimeout(() => {
      const clientHeight = merchant.current?.clientHeight || 0
      setShowMore(clientHeight > 42)
    }, 10)
  }, [])

  return (
    <div>
      <div
        className={cn(
          'text-[14px] font-[400] leading-[20px] text-white/50',
          showCompleteDesc
            ? 'text-white/50'
            : 'relative overflow-hidden text-left'
        )}
      >
        <div
          className={cn(!showCompleteDesc && styles['build'])}
          title={text}
          // onClick={showTotalIntro}
        >
          <div
            ref={merchant}
            className={cn('relative', !showCompleteDesc && 'leading-[20px]')}
          >
            {text}
            {showMore && (
              <span
                className={cn(
                  showCompleteDesc &&
                    'bottom-[-12px] right-0 block text-right font-[400] text-primary'
                )}
                onClick={showTotalIntro}
              >
                {t('video.close')}
              </span>
            )}
          </div>
          {!showCompleteDesc && (
            <div
              className={cn(
                'absolute bottom-0 right-[5px] z-[1] h-[20px] text-primary'
              )}
              onClick={showTotalIntro}
            >
              {showMore && <p>{t('video.more')}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdvancedTextCollapse
