import React from 'react';
import styled from 'styled-components';

export const filters = [
  {
    name: 'Blur',
    apply: canvas => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.filter = 'blur(2px)';
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      tempCtx.drawImage(canvas, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.filter = 'none';
    },
  },
  {
    name: 'Sharpen',
    apply: canvas => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
      const tempImageData = new ImageData(canvas.width, canvas.height);

      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4;
          let r = 0;
          let g = 0;
          let b = 0;

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pidx = ((y + ky) * canvas.width + (x + kx)) * 4;
              const weight = kernel[(ky + 1) * 3 + (kx + 1)];
              r += pixels[pidx] * weight;
              g += pixels[pidx + 1] * weight;
              b += pixels[pidx + 2] * weight;
            }
          }

          tempImageData.data[idx] = Math.min(255, Math.max(0, r));
          tempImageData.data[idx + 1] = Math.min(255, Math.max(0, g));
          tempImageData.data[idx + 2] = Math.min(255, Math.max(0, b));
          tempImageData.data[idx + 3] = pixels[idx + 3];
        }
      }

      ctx.putImageData(tempImageData, 0, 0);
    },
  },
  {
    name: 'Grayscale',
    apply: canvas => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      }

      ctx.putImageData(imageData, 0, 0);
    },
  },
  {
    name: 'Invert',
    apply: canvas => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }

      ctx.putImageData(imageData, 0, 0);
    },
  },
  {
    name: 'Sepia',
    apply: canvas => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }

      ctx.putImageData(imageData, 0, 0);
    },
  },
];

function PaintFiltersMenu({ onApplyFilter }) {
  return (
    <Wrap>
      <Select
        defaultValue=""
        onChange={event => {
          const filter = filters.find(item => item.name === event.target.value);
          if (filter) onApplyFilter(filter);
          event.target.value = '';
        }}
      >
        <option value="">Filters</option>
        {filters.map(filter => (
          <option key={filter.name} value={filter.name}>
            {filter.name}
          </option>
        ))}
      </Select>
      <Arrow>▼</Arrow>
    </Wrap>
  );
}

const Wrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 4px;

  &:hover {
    background: #d8d2bd;
  }
`;

const Select = styled.select`
  height: 100%;
  padding: 0 12px 0 0;
  border: 0;
  background: transparent;
  appearance: none;
  font-size: 11px;
  color: #000;

  &:focus {
    outline: none;
  }
`;

const Arrow = styled.span`
  position: absolute;
  right: 4px;
  font-size: 9px;
  pointer-events: none;
`;

export default PaintFiltersMenu;
