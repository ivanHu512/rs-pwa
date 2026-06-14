/**
 * 格式化字符串用于URL
 * @param str 输入字符串
 * @returns 格式化后的字符串
 */
function formatUrlString(str: string): string {
    return (
      str
        .toLowerCase()
        .trim()
        // .replace(/[^\w\s\u4e00-\u9fa5]/g, '-')
        .replace(/[\p{P}]/gu, "-")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
  }
  
  /**
   * 校验作品详情页&章节列表url
   * @param url
   * @returns
   */
  export function validBookUrl(url: string) {
    let valid = true;
    url = url.indexOf("?") ? url.split("?")[0] : url;
    const matches = url.match(/[^-]+/g) || [];
    const [book_id] = matches.slice(-1);
  
    if (!book_id) {
      valid = false;
    }
  
    return { valid, book_id };
  }
  
  /**
   * 生成作品详情链接
   * @param book_id 书籍ID
   * @param book_title 书籍标题
   * @returns 格式化的URL字符串
   */
  export function genBookDetailUrl(book_id: string, book_title: string): string {
    const formattedTitle = formatUrlString(book_title);
    return `/movie/${formattedTitle}-${book_id}`;
  }
  