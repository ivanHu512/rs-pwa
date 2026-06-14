import { useParams } from 'next/navigation'
import { useI18n } from '@/i18n'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { CollapsibleText } from '@/components/collapsibleText'
import CustomerDrawer from '@/components/drawer'
import AdvancedTextCollapse from '@/components/text-collapse'
import { useItemRefs } from '@/hooks/use-item-refs'
import { useNavChapter } from '@/hooks/use-nav-chapter'
import { useReport } from '@/hooks/use-report'
import { sessionKeyCurrentChapter, sessionKeyNextChapter } from '@/lib/constant'
import { getChapterInfo } from '@/lib/services/book'
import { cn } from '@/lib/utils'
import { useDramaStore } from '@/stores/drama-store'
import {
  BookPreLoadType,
  ChapterItem,
  ChapterLockStatus,
  ChapterTitleItem,
  ControlStatusEnum,
  ImageLoadStatus,
  VideoType,
} from '@/types/drama'

import ChapterCard from './card'

//每个tab30章节
const itemsTabsPage = 30
//drawer动画时间500ms
const delay = 600
interface Tab {
  id: number
  label: string
  chapters: Array<ChapterItem | BookPreLoadType>
}

const DramaPopup: React.FC = () => {
  const {
    bookDetail,
    chapterList,
    currentChapter,
    accountInfo,
    drawerVisible,
    updateDrawerVisible,
    updateControlStatus,
  } = useDramaStore(
    useShallow((state) => ({
      bookDetail: state.bookDetail,
      chapterList: state.chapterList,
      currentChapter: state.currentChapter,
      accountInfo: state.accountInfo,
      drawerVisible: state.drawerVisible,
      updateDrawerVisible: state.updateDrawerVisible,
      updateControlStatus: state.updateControlStatus,
    }))
  )
  const { t } = useI18n()
  const { setRef, getItemRect, scrollToItem } = useItemRefs()
  const [activeTab, setActiveTab] = useState<number>(1)
  const [loadStatus, setLoadStatus] = useState(ImageLoadStatus.NON)
  const titleRef = useRef<HTMLDivElement>(null)
  const titleLabelRef = useRef<HTMLLabelElement>(null)
  const tabRef = useRef<HTMLDivElement>(null)
  const chapterRef = useRef<HTMLDivElement>(null)
  const [isTitleAtTop, setIsTitleAtTop] = useState<boolean>(false)
  const [isSingleHeight, setIsSingleHeight] = useState<boolean>(true)
  const tabInitPosition = useRef<number>(0)
  const { navigateToChapter } = useNavChapter()

  /** 判断是否可视区域�?*/
  const isChapterInView = useCallback(
    (chapterId: string | number) => {
      const chapterRect = getItemRect(chapterId)
      const scrollContainerRect =
        titleRef.current?.parentElement?.getBoundingClientRect() ?? null

      if (!chapterRect || !scrollContainerRect) {
        return false
      }

      return (
        chapterRect.bottom > scrollContainerRect.top &&
        chapterRect.top < scrollContainerRect.bottom
      )
    },
    [getItemRect]
  )

  /**
   * @param 章节列表
   * @return 返回一个收集tab选项的二级数�?
   */
  const tabsChapters = useMemo(() => {
    const tabs: Array<Tab> = []
    const chapterIndex =
      chapterList.find((item) => item.chapter_id === currentChapter.chapter_id)
        ?.sort || 0
    for (let i = 0; i < chapterList.length; i += itemsTabsPage) {
      const pageNumber = Math.floor(i / itemsTabsPage) + 1
      const startIndex = i
      const endIndex = Math.min(i + itemsTabsPage - 1, chapterList.length - 1)
      const startNumber = chapterList[startIndex]?.serial_number || 0
      const endNumber = chapterList[endIndex]?.serial_number || 0
      if (chapterIndex >= startIndex && chapterIndex <= endIndex) {
        setActiveTab(pageNumber)
      }
      tabs.push({
        id: pageNumber,
        label: `${startNumber}-${endNumber}`,
        chapters: chapterList.slice(i, i + itemsTabsPage),
      })
    }
    return tabs
  }, [chapterList, currentChapter.chapter_id])
  /**
   * 根据tab，获取章节列�?
   */
  const currentTabChapters = useMemo(() => {
    return tabsChapters.find((tab) => tab.id === activeTab)?.chapters || []
  }, [tabsChapters, activeTab])
  /**
   * 当activeTab变化时，自动滚动对应的tab到视口内
   */
  useEffect(() => {
    if (activeTab && tabRef.current) {
      // 使用 scrollToItem 方法滚动到对应的 tab
      scrollToItem(activeTab, { block: 'nearest', inline: 'center' })
    }
  }, [activeTab, scrollToItem])
  /**
   * 获取滚动条位置，切换tab之后，要定位到该tab第一章节
   * 获取到位置之后，第一时间定位到当前章�?
   */
  useEffect(() => {
    if (drawerVisible) {
      setTimeout(() => {
        if (tabRef.current) {
          tabInitPosition.current = tabRef.current.getBoundingClientRect().top
          const chapterId = String(currentChapter.chapter_id)
          if (!isChapterInView(chapterId)) {
            scrollToItem(chapterId, { block: 'center' })
          }
        }
      }, delay)
    }
  }, [drawerVisible, currentChapter.chapter_id])
  /**
   * 点击tab切换
   */
  const handleTabClick = useCallback(
    (tabId: number) => {
      setActiveTab(tabId)
      // 切换tab时滚动到章节列表顶部
      if (chapterRef.current) {
        if (!isTitleAtTop) return
        const firstChapterCardTop =
          getItemRect(currentTabChapters[0].chapter_id)?.top || 0
        const currentTabTop = tabRef.current?.getBoundingClientRect()?.top || 0
        const currentTabHeight =
          tabRef.current?.getBoundingClientRect()?.height || 0
        const parentElement = chapterRef.current.parentElement
        const moveDistance =
          currentTabTop + currentTabHeight - firstChapterCardTop
        if (parentElement) {
          parentElement.scrollTop = parentElement.scrollTop - moveDistance
        }
      }
    },
    [isTitleAtTop, currentTabChapters]
  )
  /**
   * 根据标题高度设置下外边距
   */
  useEffect(() => {
    if (drawerVisible) {
      if (bookDetail.book_title) {
        setTimeout(() => {
          setIsSingleHeight(Number(titleLabelRef.current?.clientHeight) < 30)
        }, delay)
        return
      }
      setIsSingleHeight(false)
    }
  }, [bookDetail.book_title, drawerVisible])
  /**
   * 选择章节
   * @param chapter
   * 选择可读章节回到顶部
   * 选择充值章节，则保持不�?
   */
  const handleChapterCard = useCallback(
    async (chapter: ChapterItem | BookPreLoadType) => {
      if (currentChapter.chapter_id !== chapter.chapter_id) {
        navigateToChapter(chapter)
      }
      updateDrawerVisible(false)
    },
    [accountInfo, currentChapter]
  )
  /**
   * 获取元素数据
   */
  useEffect(() => {
    let scrollContainer: Element | null = null
    let timeoutId: number
    const handleScroll = () => {
      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect()
        const parentElement = titleRef.current.parentElement
        if (parentElement) {
          const parentRect = parentElement.getBoundingClientRect()
          const relativeTop = titleRect.top - parentRect.top
          setIsTitleAtTop(relativeTop <= 0)
        }
      }
    }
    if (drawerVisible) {
      timeoutId = setTimeout(() => {
        scrollContainer = titleRef.current?.parentElement || null
        if (scrollContainer) {
          scrollContainer.addEventListener('scroll', handleScroll, true)
        }
      }, delay)
    }
    return () => {
      clearTimeout(timeoutId)
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [drawerVisible])

  return (
    <CustomerDrawer
      className='border-none px-0 pb-0'
      zIndex={52}
      isOpen={drawerVisible}
      onOpenChange={updateDrawerVisible}
    >
      <div className='touch-pan-y flex-col overflow-y-auto px-4 pb-[16px]'>
        <div className='mt-[30px] flex w-full justify-center'>
          <div className='relative h-[113px] w-[80px]'>
            <div className='relative h-full w-full'>
              {loadStatus !== ImageLoadStatus.FAIL && (
                <img
                  src={bookDetail.book_pic}
                  alt={''}
                  className={cn('h-full w-full rounded-[4px] object-cover')}
                  width={113}
                  height={80}
                  onLoad={() => {
                    setLoadStatus(ImageLoadStatus.SUCCESS)
                  }}
                  onError={(e) => {
                    setLoadStatus(ImageLoadStatus.FAIL)
                  }}
                />
              )}
            </div>
            {loadStatus === ImageLoadStatus.FAIL && (
              <div className='absolute left-0 top-0 h-full w-full rounded-[4px] bg-white/20'></div>
            )}
          </div>
        </div>
        <div
          ref={titleRef}
          className={cn(
            'sticky top-0 z-[2] mt-[16px] bg-[rgb(20,20,20)] text-[16px] text-white',
            'flex h-[24px] items-start justify-center',
            !isSingleHeight && 'h-[48px]'
          )}
        >
          <label
            ref={titleLabelRef}
            className={cn(
              'line-clamp-2 font-[500] transition-all duration-200 ease-in-out',
              isTitleAtTop && 'line-clamp-1'
            )}
          >
            {bookDetail.book_title}
          </label>
        </div>
        <div className='mt-[16px] text-[14px] font-[400] text-white/50'>
          {/* <AdvancedTextCollapse text={bookDetail.special_desc} /> */}
          <CollapsibleText
            className='mt-[8px] break-words text-[14px] font-[400] leading-[1.5] text-white/50'
            isHtml
            content={bookDetail.special_desc}
            moreButton={
              <span className='cursor-pointer text-[14px] text-primary'>
                {t('video.more')}
              </span>
            }
          />
        </div>
        <div className='my-[20px] h-[0.5px] bg-white/15'></div>
        <p
          className={cn(
            'mb-[16px] text-[16px] font-[700] text-white/90',
            isSingleHeight && 'mb-[10px]'
          )}
        >
          {t('video.episode')}
        </p>
        {/* Tab导航 */}
        <div
          ref={tabRef}
          className={cn(
            'sticky top-[30px] z-[2] overflow-x-auto bg-[rgb(20,20,20)] pb-[16px]',
            isSingleHeight && 'top-[23px] pt-[6px]'
          )}
        >
          <div className='flex w-[max-content] items-center'>
            {tabsChapters.map((tab, index) => (
              <span
                ref={setRef(tab.id)}
                key={tab.id}
                className={cn(
                  'mr-[20px] text-[14px] font-[400] text-white/50',
                  activeTab === tab.id && 'font-[700] text-white/90',
                  index === tabsChapters.length - 1 && 'mr-0'
                )}
                onClick={() => handleTabClick(tab.id)}
              >
                {tab.label}
              </span>
            ))}
          </div>
        </div>

        {/* 章节列表 */}
        <div
          ref={chapterRef}
          className='grid flex-1 grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-[4px]'
        >
          {currentTabChapters.map((chapter, index) => (
            <div
              ref={setRef(chapter.chapter_id)}
              key={chapter.chapter_id}
              className={cn(
                'mb-[6px] h-[48px] w-[64px] rounded-[4px] bg-white/10'
              )}
              onClick={() => handleChapterCard(chapter)}
            >
              <ChapterCard
                id={chapter.chapter_id}
                serial_number={chapter.serial_number}
                video_type={chapter.video_type}
                vip_free={chapter.vip_free}
                is_lock={chapter.is_lock}
              />
            </div>
          ))}
        </div>
      </div>
    </CustomerDrawer>
  )
}

export default DramaPopup
