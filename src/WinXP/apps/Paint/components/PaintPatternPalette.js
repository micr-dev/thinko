import React from 'react';
import styled from 'styled-components';

function PaintPatternPalette({ selectedPattern, onPatternSelect }) {
  const patterns = Array.from({ length: 38 }, (_, i) => i + 1);

  return (
    <Wrap>
      <Inner>
        {patterns.map(num => {
          const patternId = `pattern-${num}`;
          return (
            <PatternButton
              key={patternId}
              type="button"
              title={`Pattern ${num}`}
              $active={selectedPattern === patternId}
              onClick={() => onPatternSelect(patternId)}
            >
              <img src={`/patterns/Property 1=${num}.svg`} alt="" />
            </PatternButton>
          );
        })}
      </Inner>
    </Wrap>
  );
}

const Wrap = styled.div`
  width: 100%;
  height: 56px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 2px;
  background: #d4d0c8;
`;

const Inner = styled.div`
  display: grid;
  width: 100%;
  grid-template-rows: repeat(2, 24px);
  grid-template-columns: repeat(19, minmax(24px, 1fr));
  min-width: 456px;
`;

const PatternButton = styled.button`
  height: 24px;
  padding: 0;
  border: 1px solid ${({ $active }) => ($active ? '#0a246a' : '#8e8a7b')};
  background: #fff;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }
`;

export default PaintPatternPalette;
