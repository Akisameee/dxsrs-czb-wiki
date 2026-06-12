export type GameImageAtlasEntry = {
  name: string;
  source: string;
  pathId?: number;
  key?: string;
  atlas: string;
  atlasWidth: number;
  atlasHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  textureWidth: number;
  textureHeight: number;
  trim: {
    x: number;
    y: number;
    width: number;
    height: number;
    trimmed: boolean;
  };
};

export type GameImageRenderEntry = {
  src: string;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
  atlasWidth: number;
  atlasHeight: number;
};

export type GameImageLayer = {
  name: string | null | undefined;
  source?: string | null;
  pathId?: number | null;
  opacity?: number | null;
  x?: number;
  y?: number;
};

export type ComposedGameImage = GameImageRenderEntry & {
  url: string;
  sourceWidth: number;
  sourceHeight: number;
  trim: {
    x: number;
    y: number;
    width: number;
    height: number;
    trimmed: boolean;
  };
};

const atlasImageCache = new Map<string, Promise<HTMLImageElement>>();

function loadAtlasImage(src: string) {
  if (atlasImageCache.has(src)) return atlasImageCache.get(src)!;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
  atlasImageCache.set(src, promise);
  return promise;
}

function imageDataBounds(data: ImageData) {
  let left = data.width;
  let top = data.height;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < data.height; y += 1) {
    for (let x = 0; x < data.width; x += 1) {
      const alpha = data.data[(y * data.width + x) * 4 + 3];
      if (!alpha) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x + 1);
      bottom = Math.max(bottom, y + 1);
    }
  }

  if (right <= left || bottom <= top) return null;
  return { left, top, right, bottom };
}

export function useGameImageAtlas() {
  const { data, pending, error } = useFetch<GameImageAtlasEntry[]>(
    "/images/manifest.json",
    {
      key: "game-image-atlas-manifest",
      server: false,
    },
  );

  const entries = computed(() => {
    const map = new Map<string, GameImageAtlasEntry>();
    for (const entry of data.value || []) {
      if (entry.name && !map.has(entry.name)) map.set(entry.name, entry);
    }
    return map;
  });

  const entriesBySource = computed(() => {
    const map = new Map<string, GameImageAtlasEntry>();
    for (const entry of data.value || []) {
      if (entry.source) map.set(entry.source, entry);
    }
    return map;
  });

  const entriesByAssetKey = computed(() => {
    const map = new Map<string, GameImageAtlasEntry>();
    for (const entry of data.value || []) {
      if (entry.key) map.set(entry.key, entry);
      if (entry.source && entry.pathId !== undefined) map.set(`${entry.source}:${entry.pathId}`, entry);
    }
    return map;
  });

  function getImage(name: string | null | undefined) {
    if (!name) return null;
    return entries.value.get(name) || null;
  }

  function getImageBySource(source: string | null | undefined) {
    if (!source) return null;
    return entriesBySource.value.get(source) || null;
  }

  function getImageByAsset(source: string | null | undefined, pathId: number | null | undefined) {
    if (!source || pathId === null || pathId === undefined) return null;
    return entriesByAssetKey.value.get(`${source}:${pathId}`) || null;
  }

  function getRenderEntry(
    name: string | null | undefined,
    source?: string | null,
    pathId?: number | null,
  ): GameImageRenderEntry | null {
    const entry = getImageByAsset(source, pathId) || getImageBySource(source) || getImage(name);
    if (!entry) return null;

    return {
      src: `/images/${entry.atlas}`,
      x: entry.x,
      y: entry.y,
      offsetX: entry.trim.x,
      offsetY: entry.trim.y,
      width: entry.width,
      height: entry.height,
      canvasWidth: entry.textureWidth,
      canvasHeight: entry.textureHeight,
      atlasWidth: entry.atlasWidth,
      atlasHeight: entry.atlasHeight,
    };
  }

  async function composeImageLayers(layers: GameImageLayer[]) {
    if (!import.meta.client) return null;

    const resolvedLayers = layers
      .map((layer) => {
        const entry = getImageByAsset(layer.source, layer.pathId) || getImageBySource(layer.source) || getImage(layer.name);
        return entry ? { ...layer, entry } : null;
      })
      .filter((layer): layer is GameImageLayer & { entry: GameImageAtlasEntry } => Boolean(layer));

    if (!resolvedLayers.length) return null;

    const sourceWidth = Math.max(
      ...resolvedLayers.map((layer) => (layer.x || 0) + layer.entry.textureWidth),
    );
    const sourceHeight = Math.max(
      ...resolvedLayers.map((layer) => (layer.y || 0) + layer.entry.textureHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;

    const context = canvas.getContext("2d");
    if (!context) return null;

    for (const layer of resolvedLayers) {
      const entry = layer.entry;
      const atlas = await loadAtlasImage(`/images/${entry.atlas}`);
      context.globalAlpha = layer.opacity ?? 1;
      context.drawImage(
        atlas,
        entry.x,
        entry.y,
        entry.width,
        entry.height,
        (layer.x || 0) + entry.trim.x,
        (layer.y || 0) + entry.trim.y,
        entry.width,
        entry.height,
      );
    }
    context.globalAlpha = 1;

    const bounds = imageDataBounds(context.getImageData(0, 0, sourceWidth, sourceHeight));
    if (!bounds) return null;

    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    const trimmedCanvas = document.createElement("canvas");
    trimmedCanvas.width = width;
    trimmedCanvas.height = height;
    const trimmedContext = trimmedCanvas.getContext("2d");
    if (!trimmedContext) return null;
    trimmedContext.drawImage(
      canvas,
      bounds.left,
      bounds.top,
      width,
      height,
      0,
      0,
      width,
      height,
    );

    const url = trimmedCanvas.toDataURL("image/webp");
    return {
      src: url,
      x: 0,
      y: 0,
      offsetX: 0,
      offsetY: 0,
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      atlasWidth: width,
      atlasHeight: height,
      url,
      sourceWidth,
      sourceHeight,
      trim: {
        x: bounds.left,
        y: bounds.top,
        width,
        height,
        trimmed: bounds.left > 0 || bounds.top > 0 || width < sourceWidth || height < sourceHeight,
      },
    } satisfies ComposedGameImage;
  }

  return {
    entries,
    entriesBySource,
    entriesByAssetKey,
    pending,
    error,
    getImage,
    getImageBySource,
    getImageByAsset,
    getRenderEntry,
    composeImageLayers,
  };
}
