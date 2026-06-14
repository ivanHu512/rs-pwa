export type HistoryItem = {
  book_id: string
  book_title: string
  book_pic: string
  book_type: number
  chapter_count: number
  read_chapter_id: string
  read_episode: number
  read_sec: number
  read_progress: number
  t_book_id: string
  is_preview: number
  have_trailer: boolean
  online_count_down: number
  is_collect: number
  last_view: number
  duration: number
  start_play?: HistoryStartPlay
  lang: string
}

export type HistoryStartPlay = {
  chapter_id: string
  duration: number
  video_pic: string
  video_type: number
  chapter_index: number
  episode_index: number | boolean
  play_info: string
  adult_content_remind: number
}

export type HistoryRequest = {
  page_size?: number
  offset?: string
}

export type HistoryResponse = {
  offset?: string
  list?: HistoryItem[]
}
