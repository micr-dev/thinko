const runtimeCanvas = 'resources/iwbtg.cch';
const resourcePartCount = 6;
const resourceMap = new Map();
const progressState = {
  download: 0,
  extract: 0,
};

function postProgress() {
  window.parent.postMessage(
    {
      type: 'IWBTG_PROGRESS',
      download: progressState.download,
      extract: progressState.extract,
      complete:
        progressState.download === 100 && progressState.extract === 100,
    },
    '*',
  );
}

function updateProgress(id, percent) {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const bar = document.getElementById(`${id}-bar`);
  const text = document.getElementById(`${id}-text`);

  if (bar) {
    bar.style.width = `${clampedPercent}%`;
  }

  if (text) {
    text.innerText = `${clampedPercent}%`;
  }

  progressState[id] = clampedPercent;
  postProgress();
}

function getParts(fileName, totalParts) {
  return Array.from({ length: totalParts }, (_, index) => {
    return `${fileName}.part${index + 1}`;
  });
}

async function mergeFiles(fileParts) {
  const sizes = await Promise.all(
    fileParts.map(async part => {
      const response = await fetch(part, { method: 'HEAD' });

      if (!response.ok) {
        throw new Error(`Missing file part: ${part}`);
      }

      return Number.parseInt(response.headers.get('Content-Length') || '0', 10);
    }),
  );

  const totalSize = sizes.reduce((sum, size) => sum + size, 0);
  const buffers = [];
  let loadedSize = 0;

  for (const part of fileParts) {
    const response = await fetch(part);

    if (!response.ok) {
      throw new Error(`Failed to fetch file part: ${part}`);
    }

    const data = await response.arrayBuffer();
    buffers.push(data);
    loadedSize += data.byteLength;
    updateProgress('download', Math.floor((loadedSize / totalSize) * 100));
  }

  return new Blob(buffers);
}

function installResourceInterceptors() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function patchedFetch(input, init) {
    if (typeof input === 'string' && input.startsWith('resources/')) {
      const fileName = input.split('/').pop();
      if (resourceMap.has(fileName)) {
        return originalFetch(resourceMap.get(fileName), init);
      }
    }

    return originalFetch(input, init);
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function patchedOpen(method, url) {
    let nextUrl = url;

    if (typeof url === 'string' && url.startsWith('resources/')) {
      const fileName = url.split('/').pop();
      if (resourceMap.has(fileName)) {
        nextUrl = resourceMap.get(fileName);
      }
    }

    return originalOpen.call(this, method, nextUrl);
  };

  [HTMLImageElement, HTMLAudioElement, HTMLVideoElement].forEach(ElementType => {
    const descriptor = Object.getOwnPropertyDescriptor(
      ElementType.prototype,
      'src',
    );

    if (!descriptor || !descriptor.set) return;

    Object.defineProperty(ElementType.prototype, 'src', {
      configurable: true,
      enumerable: true,
      get: descriptor.get,
      set(value) {
        let nextValue = value;

        if (typeof value === 'string' && value.startsWith('resources/')) {
          const fileName = value.split('/').pop();
          if (resourceMap.has(fileName)) {
            nextValue = resourceMap.get(fileName);
          }
        }

        descriptor.set.call(this, nextValue);
      },
    });
  });
}

async function extractResources(zipBlob) {
  const zip = await JSZip.loadAsync(zipBlob);
  const files = Object.keys(zip.files).filter(name => !zip.files[name].dir);

  for (let index = 0; index < files.length; index += 1) {
    const fileName = files[index];
    const file = zip.files[fileName];
    const blob = await file.async('blob');
    resourceMap.set(fileName, URL.createObjectURL(blob));
    updateProgress(
      'extract',
      Math.floor(((index + 1) / files.length) * 100),
    );
  }
}

function showError(error) {
  const container = document.getElementById('progress-container');

  if (container) {
    container.style.display = 'block';
    container.innerHTML = `
      <div style="font-weight:bold; margin-bottom:8px;">Failed to load IWBTG</div>
      <div style="font-size:12px; line-height:1.4;">${error.message}</div>
    `;
  }

  console.error(error);
}

async function boot() {
  try {
    postProgress();

    const zipBlob = await mergeFiles(getParts('resources.zip', resourcePartCount));
    await extractResources(zipBlob);
    installResourceInterceptors();

    const runtimeScript = document.createElement('script');
    runtimeScript.src = 'Runtime.js';
    runtimeScript.onload = () => {
      document.getElementById('progress-container').style.display = 'none';
      postProgress();
      new Runtime('MMFCanvas', runtimeCanvas);
    };
    runtimeScript.onerror = () => {
      showError(new Error('Runtime.js failed to load.'));
    };
    document.head.appendChild(runtimeScript);
  } catch (error) {
    showError(error);
  }
}

boot();
