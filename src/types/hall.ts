export type BookShelfItemType = {
  bs_id: number
  tab_id?: number
  bookshelf_name: string
  ui_style?: number
  books?: BookItemType[]
  banners?: BannerItemType[]
  total_page?: number
  current_pageno?: number
  is_finished?: number
}

export type BannerItemType = {
  b_id: number
  title: string
  book_id?: string
  pic: string
  book_title?: string
  jump_param?: {
    book_id: string
    book_title: string
  }
}

export type BookItemType = {
  read_count: number
  book_id: string
  book_pic: string
  book_title: string
}

export type HallResponse = {
  banners: BannerItemType[]
  bookShelfList: BookShelfItemType[]
}

export type HallInfoV4Response = {
  hall_id: number
  tab_list: {
    tab_id: number
    tab_name: string
    last_modified_time: number
    is_current: number
    tab_md5: string
    sort: number
  }[]
  lists: BookShelfItemType[]
}

export type BookShelfPageV4Response = {
  lists: BookItemType[]
  is_finished: number
}
