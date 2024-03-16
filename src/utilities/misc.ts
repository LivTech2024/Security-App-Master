export const fullTextSearchIndex = (text: string): string[] => {
  const textList: string[] = [];

  if (text && text.length > 0) {
    for (let i = 0; i < text.length; i++) {
      for (let j = i + 1; j <= text.length; j++) {
        textList.push(text.substring(i, j));
      }
    }
  }

  return textList;
};

export const fullTextSearchIndexSingleWay = (text: string): string[] => {
  const textList: string[] = [];

  if (text && text.length > 0) {
    for (let i = 0; i <= text.length; i++) {
      const textResult = text.substring(0, i);
      if (textResult && textResult.length > 0) {
        textList.push(textResult);
      }
    }
  }

  return textList;
};
