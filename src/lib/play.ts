import { aesDescryptResponse } from "@cmsfe/tools/service";

const definitionLevelStr: Book.TDefinitionStr[] = [
  '360P',
  '540P',
  '720P',
  '1080P',
]
const resolutionMap: { [key: string]: Book.TDefinitionStr } = {
  '360': '360P',
  '540': '540P',
  '720': '720P',
  '1080': '1080P',
}

/**获取播放地址 */
export const getPlayUrl = (play_info?: string) => {
  if (!play_info || typeof play_info !== 'string') return []
  const str: Book.IPlayInfo[] = aesDescryptResponse(play_info)
  return str
}

/** 多分辨率格式化
 * @param data 接口字段play_info
 * @param definitionValue 清晰度 0,1,2,3
 * @returns 传入definitionValue返回播放链接否则返回多分辨率列表
 */
export function formatDefinition(
  data: any,
  definitionValue?: number
): Book.IPlayItem[] | Book.IPlayItem {
  const res = getPlayUrl(data)
  let playList: Book.IPlayItem[] = res
    .filter((item) => item.Encode !== 'H265' && item.Dpi !== 1080 && item.Dpi !== 720 )
    .sort((a, b) => a.Dpi - b.Dpi)
    .map((item) => {
      return {
        url: item.PlayURL,
        definition: resolutionMap[item.Dpi],
        dpi: item.Dpi
      }
    })
  // 防止没有播放数据导致取值报错
  if (playList.length === 0) {
    playList = [
      {
        url: '',
        definition: '540P',
        dpi: 540
      },
    ]
  }
  if (definitionValue === undefined) return playList[playList.length - 1]
  //fix
  // definitionValue 转成对应的清晰度
  const dpi = definitionLevelStr[definitionValue]
  // 根据清晰度获取对应链接
  let definition = playList.find((item) => item.definition === dpi)
  if (!definition) {
    // 取不到当前分辨率视频，默认取最后一条
    definition = playList[playList.length - 1]
  }
  return definition
}