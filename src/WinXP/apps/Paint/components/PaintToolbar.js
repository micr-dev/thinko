import React from 'react';
import styled from 'styled-components';

const defaultTools = [
  { id: 'select', icon: '/icons/default/macpaint/lasso.png', label: 'Lasso' },
  {
    id: 'rect-select',
    icon: '/icons/default/macpaint/select.png',
    label: 'Select',
  },
  { id: 'hand', icon: '/icons/default/macpaint/hand.png', label: 'Hand' },
  { id: 'text', icon: '/icons/default/macpaint/text.png', label: 'Text' },
  { id: 'bucket', icon: '/icons/default/macpaint/bucket.png', label: 'Fill' },
  { id: 'spray', icon: '/icons/default/macpaint/spray.png', label: 'Spray' },
  { id: 'brush', icon: '/icons/default/macpaint/brush.png', label: 'Brush' },
  { id: 'pencil', icon: '/icons/default/macpaint/pencil.png', label: 'Pencil' },
  { id: 'line', icon: '/icons/default/macpaint/line.png', label: 'Line' },
  { id: 'eraser', icon: '/icons/default/macpaint/eraser.png', label: 'Eraser' },
  {
    id: 'rectangle',
    icon: '/icons/default/macpaint/rectangle.png',
    label: 'Rectangle',
  },
  { id: 'oval', icon: '/icons/default/macpaint/oval.png', label: 'Oval' },
];

function PaintToolbar({ selectedTool, onToolSelect, tools = defaultTools }) {
  return (
    <Grid>
      {tools.map(tool => (
        <ToolButton
          key={tool.id}
          type="button"
          title={tool.label}
          aria-pressed={selectedTool === tool.id}
          $active={selectedTool === tool.id}
          onClick={() => onToolSelect(tool.id)}
        >
          <img src={tool.icon} alt="" />
        </ToolButton>
      ))}
    </Grid>
  );
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
`;

const ToolButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid #7f9db9;
  background: ${({ $active }) => ($active ? '#0a246a' : '#ece9d8')};
  box-shadow: inset 1px 1px 0 #fff, inset -1px -1px 0 #aca899;

  img {
    width: 28px;
    height: 28px;
    object-fit: contain;
    filter: ${({ $active }) => ($active ? 'invert(1)' : 'none')};
    pointer-events: none;
  }
`;

export default PaintToolbar;
