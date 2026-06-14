
type Options = {
  m3u8Url: string, 
  chapterId: string, 
  id: string
}

export async function getTSFiles(options: Options): Promise<string[]> {
  try {
    const response = await fetch(options.m3u8Url, {
      cache: 'force-cache',
    });

    const m3u8Text = await response.text();
    const lines = m3u8Text.split('\n');
    const tsFiles: string[] = [];

    for (let line of lines) {
      line = line.trim();

      if (line.endsWith('.ts')) {
        const tsUrl = new URL(line, options.m3u8Url).href;
        tsFiles.push(tsUrl);
      }
    }

    return tsFiles;
  } catch (error) {
    console.error('Error fetching or parsing m3u8 file:', error);
    return [];
  }
}


