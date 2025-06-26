// Common utility functions for Figma plugin

// Helper function for progress updates
export function sendProgressUpdate(
  commandId: string,
  commandType: string,
  status: 'started' | 'in_progress' | 'completed' | 'error',
  progress: number,
  totalItems: number,
  processedItems: number,
  message: string,
  payload?: unknown
) {
  const update = {
    type: "command_progress",
    commandId,
    commandType,
    status,
    progress,
    totalItems,
    processedItems,
    message,
    timestamp: Date.now(),
    payload
  };

  figma.ui.postMessage(update);
  console.log(`Progress update: ${status} - ${progress}% - ${message}`);
}

export function generateCommandId(): string {
  return (
    "cmd_" +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function getNodePath(node: SceneNode): string {
  const path: string[] = [];
  let current: BaseNode | null = node;
  
  while (current && current.parent) {
    path.unshift(current.name);
    current = current.parent;
  }
  
  return path.join(' > ');
}

export async function highlightNodeWithAnimation(node: SceneNode): Promise<void> {
  if (!('strokes' in node) || !('strokeWeight' in node)) return;
  
  // Save original stroke properties
  const originalStrokeWeight = node.strokeWeight;
  const originalStrokes = node.strokes ? [...node.strokes] : [];
  
  try {
    // Apply orange border stroke
    node.strokeWeight = 4;
    node.strokes = [{
      type: 'SOLID',
      color: { r: 1, g: 0.5, b: 0 }, // Orange color
      opacity: 0.8
    }];
    
    // Set timeout for animation effect (restore to original after 1.5 seconds)
    setTimeout(() => {
      try {
        // Restore original stroke properties
        node.strokeWeight = originalStrokeWeight;
        node.strokes = originalStrokes;
      } catch (restoreError) {
        console.error(`Error restoring node stroke: ${restoreError}`);
      }
    }, 1500);
  } catch (highlightError) {
    console.error(`Error highlighting node: ${highlightError}`);
    // Continue even if highlighting fails
  }
}

export async function highlightNodeWithFill(node: SceneNode, duration: number = 1000): Promise<void> {
  if (!('fills' in node)) return;
  
  try {
    // Save original fills for restoration later
    const originalFills = JSON.parse(JSON.stringify(node.fills));
    
    // Apply highlight color (orange with 30% opacity)
    node.fills = [{
      type: "SOLID",
      color: { r: 1, g: 0.5, b: 0 },
      opacity: 0.3,
    }];
    
    // Use delay function for consistent timing
    await delay(duration);
    
    try {
      node.fills = originalFills;
    } catch (restoreError) {
      console.error(`Error restoring fills: ${restoreError}`);
    }
  } catch (highlightError) {
    console.error(`Error highlighting node: ${highlightError}`);
    // Continue anyway, highlighting is just visual feedback
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Color utility functions
export function rgbaToHex(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a !== undefined ? Math.round(color.a * 255) : 255;

  if (a === 255) {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          return x.toString(16).padStart(2, "0");
        })
        .join("")
    );
  }

  return (
    "#" +
    [r, g, b, a]
      .map((x) => {
        return x.toString(16).padStart(2, "0");
      })
      .join("")
  );
}

// Font utility functions
export function getFontStyle(weight: number): string {
  switch (weight) {
    case 100:
      return "Thin";
    case 200:
      return "Extra Light";
    case 300:
      return "Light";
    case 400:
      return "Regular";
    case 500:
      return "Medium";
    case 600:
      return "Semi Bold";
    case 700:
      return "Bold";
    case 800:
      return "Extra Bold";
    case 900:
      return "Black";
    default:
      return "Regular";
  }
}

// Base64 encoding utility for image export
export function customBase64Encode(bytes: Uint8Array): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let base64 = "";

  const byteLength = bytes.byteLength;
  const byteRemainder = byteLength % 3;
  const mainLength = byteLength - byteRemainder;

  let a: number, b: number, c: number, d: number;
  let chunk: number;

  // Main loop deals with bytes in chunks of 3
  for (let i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048 = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032 = (2^6 - 1) << 6
    d = chunk & 63; // 63 = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += chars[a] + chars[b] + chars[c] + chars[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder === 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3 = 2^2 - 1

    base64 += chars[a] + chars[b] + "==";
  } else if (byteRemainder === 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008 = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15 = 2^4 - 1

    base64 += chars[a] + chars[b] + chars[c] + "=";
  }

  return base64;
}

// Array utility functions
export function uniqBy<T>(arr: T[], predicate: string | ((item: T) => unknown)): T[] {
  const cb = typeof predicate === "function" ? predicate : (o: T) => (o as Record<string, unknown>)[predicate];
  return [
    ...arr
      .reduce((map, item) => {
        const key = item === null || item === undefined ? item : cb(item);
        map.has(key) || map.set(key, item);
        return map;
      }, new Map())
      .values(),
  ];
}

// Advanced text character setting functions
export async function setCharacters(
  node: TextNode,
  characters: string,
  options?: {
    fallbackFont?: FontName;
    smartStrategy?: "prevail" | "strict" | "experimental";
  }
): Promise<boolean> {
  const fallbackFont = (options && options.fallbackFont) || {
    family: "Inter",
    style: "Regular",
  };
  
  try {
    if (node.fontName === figma.mixed) {
      if (options && options.smartStrategy === "prevail") {
        const fontHashTree: Record<string, number> = {};
        for (let i = 1; i < node.characters.length; i++) {
          const charFont = node.getRangeFontName(i - 1, i);
          const key = `${(charFont as FontName).family}::${(charFont as FontName).style}`;
          fontHashTree[key] = fontHashTree[key] ? fontHashTree[key] + 1 : 1;
        }
        const prevailedTreeItem = Object.entries(fontHashTree).sort(
          (a, b) => b[1] - a[1]
        )[0];
        const [family, style] = prevailedTreeItem[0].split("::");
        const prevailedFont = {
          family,
          style,
        };
        await figma.loadFontAsync(prevailedFont);
        node.fontName = prevailedFont;
      } else if (options && options.smartStrategy === "strict") {
        return setCharactersWithStrictMatchFont(node, characters, fallbackFont);
      } else if (options && options.smartStrategy === "experimental") {
        return setCharactersWithSmartMatchFont(node, characters, fallbackFont);
      } else {
        const firstCharFont = node.getRangeFontName(0, 1);
        await figma.loadFontAsync(firstCharFont as FontName);
        node.fontName = firstCharFont as FontName;
      }
    } else {
      await figma.loadFontAsync({
        family: (node.fontName as FontName).family,
        style: (node.fontName as FontName).style,
      });
    }
  } catch (err) {
    console.warn(
      `Failed to load "${(node.fontName as FontName).family} ${(node.fontName as FontName).style}" font and replaced with fallback "${fallbackFont.family} ${fallbackFont.style}"`,
      err
    );
    await figma.loadFontAsync(fallbackFont);
    node.fontName = fallbackFont;
  }
  
  try {
    node.characters = characters;
    return true;
  } catch (err) {
    console.warn(`Failed to set characters. Skipped.`, err);
    return false;
  }
}

async function setCharactersWithStrictMatchFont(
  node: TextNode,
  characters: string,
  fallbackFont: FontName
): Promise<boolean> {
  const fontHashTree: Record<string, string> = {};
  for (let i = 1; i < node.characters.length; i++) {
    const startIdx = i - 1;
    const startCharFont = node.getRangeFontName(startIdx, i);
    const startCharFontVal = `${(startCharFont as FontName).family}::${(startCharFont as FontName).style}`;
    while (i < node.characters.length) {
      i++;
      const charFont = node.getRangeFontName(i - 1, i);
      if (startCharFontVal !== `${(charFont as FontName).family}::${(charFont as FontName).style}`) {
        break;
      }
    }
    fontHashTree[`${startIdx}_${i}`] = startCharFontVal;
  }
  
  await figma.loadFontAsync(fallbackFont);
  node.fontName = fallbackFont;
  node.characters = characters;
  
  await Promise.all(
    Object.keys(fontHashTree).map(async (range) => {
      const [start, end] = range.split("_");
      const [family, style] = fontHashTree[range].split("::");
      const matchedFont = {
        family,
        style,
      };
      await figma.loadFontAsync(matchedFont);
      return node.setRangeFontName(Number(start), Number(end), matchedFont);
    })
  );
  
  return true;
}

function getDelimiterPos(str: string, delimiter: string, startIdx: number = 0, endIdx: number = str.length): number[][] {
  const indices: number[][] = [];
  let temp = startIdx;
  for (let i = startIdx; i < endIdx; i++) {
    if (
      str[i] === delimiter &&
      i + startIdx !== endIdx &&
      temp !== i + startIdx
    ) {
      indices.push([temp, i + startIdx]);
      temp = i + startIdx + 1;
    }
  }
  temp !== endIdx && indices.push([temp, endIdx]);
  return indices.filter(Boolean);
}

function buildLinearOrder(node: TextNode): Array<{ family: string; style: string; delimiter: string }> {
  const fontTree: Array<{ start: number; delimiter: string; family: string; style: string }> = [];
  const newLinesPos = getDelimiterPos(node.characters, "\n");
  
  newLinesPos.forEach(([newLinesRangeStart, newLinesRangeEnd]) => {
    const newLinesRangeFont = node.getRangeFontName(
      newLinesRangeStart,
      newLinesRangeEnd
    );
    
    if (newLinesRangeFont === figma.mixed) {
      const spacesPos = getDelimiterPos(
        node.characters,
        " ",
        newLinesRangeStart,
        newLinesRangeEnd
      );
      spacesPos.forEach(([spacesRangeStart, spacesRangeEnd]) => {
        const spacesRangeFont = node.getRangeFontName(
          spacesRangeStart,
          spacesRangeEnd
        );
        if (spacesRangeFont === figma.mixed) {
          const firstCharFont = node.getRangeFontName(
            spacesRangeStart,
            spacesRangeStart + 1
          );
          fontTree.push({
            start: spacesRangeStart,
            delimiter: " ",
            family: (firstCharFont as FontName).family,
            style: (firstCharFont as FontName).style,
          });
        } else {
          fontTree.push({
            start: spacesRangeStart,
            delimiter: " ",
            family: (spacesRangeFont as FontName).family,
            style: (spacesRangeFont as FontName).style,
          });
        }
      });
    } else {
      fontTree.push({
        start: newLinesRangeStart,
        delimiter: "\n",
        family: (newLinesRangeFont as FontName).family,
        style: (newLinesRangeFont as FontName).style,
      });
    }
  });
  
  return fontTree
    .sort((a, b) => a.start - b.start)
    .map(({ family, style, delimiter }) => ({ family, style, delimiter }));
}

async function setCharactersWithSmartMatchFont(
  node: TextNode,
  characters: string,
  fallbackFont: FontName
): Promise<boolean> {
  const rangeTree = buildLinearOrder(node);
  const fontsToLoad = uniqBy(
    rangeTree,
    ({ family, style }) => `${family}::${style}`
  ).map(({ family, style }) => ({
    family,
    style,
  }));

  await Promise.all([...fontsToLoad, fallbackFont].map(figma.loadFontAsync));

  node.fontName = fallbackFont;
  node.characters = characters;

  let prevPos = 0;
  rangeTree.forEach(({ family, style, delimiter }) => {
    if (prevPos < node.characters.length) {
      const delimeterPos = node.characters.indexOf(delimiter, prevPos);
      const endPos =
        delimeterPos > prevPos ? delimeterPos : node.characters.length;
      const matchedFont = {
        family,
        style,
      };
      node.setRangeFontName(prevPos, endPos, matchedFont);
      prevPos = endPos + 1;
    }
  });
  
  return true;
} 