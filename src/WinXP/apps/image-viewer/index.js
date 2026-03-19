import React from 'react';
import styled from 'styled-components';

function ImageViewer({ src, title }) {
  return (
    <Container>
      <img src={src} alt={title} draggable={false} />
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #dfe7f3 100%);

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border: 1px solid #7f9db9;
    background: #fff;
    box-shadow: 0 10px 22px rgba(17, 33, 56, 0.2);
  }
`;

export default ImageViewer;
