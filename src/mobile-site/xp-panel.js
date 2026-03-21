import React from 'react';
import styled from 'styled-components';

function XpPanel({ title, icon, onClose, children, className, actions }) {
  return (
    <div className={className}>
      <div className="xp-panel__header-bg" />
      <div className="xp-panel__header">
        <div className="xp-panel__title">
          {icon && <img src={icon} alt="" />}
          <span>{title}</span>
        </div>
        {actions ||
          (onClose ? (
            <CloseButton type="button" onClick={onClose} aria-label="Close">
              <span />
            </CloseButton>
          ) : null)}
      </div>
      <div className="xp-panel__body">{children}</div>
    </div>
  );
}

const CloseButton = styled.button`
  position: relative;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #fff;
  border-radius: 4px;
  box-shadow: inset 0 -1px 2px 1px #da4600;
  background-image: radial-gradient(
    circle at 90% 90%,
    #cc4600 0%,
    #dc6527 55%,
    #cd7546 70%,
    #ffccb2 90%,
    #ffffff 100%
  );

  &:active {
    filter: brightness(90%);
  }

  span,
  span::before {
    position: absolute;
    left: 10px;
    top: 4px;
    width: 2px;
    height: 14px;
    content: '';
    background: #fff;
  }

  span {
    transform: rotate(45deg);
  }

  span::before {
    left: 0;
    top: 0;
    transform: rotate(90deg);
  }
`;

export default styled(XpPanel)`
  position: relative;
  padding: 3px;
  border-radius: 8px 8px 0 0;
  background: #0831d9;
  box-shadow: 0 14px 30px rgba(8, 25, 55, 0.3);
  overflow: hidden;

  .xp-panel__header-bg {
    position: absolute;
    inset: 0 0 auto;
    height: 28px;
    background: linear-gradient(
      to bottom,
      #0058ee 0%,
      #3593ff 4%,
      #288eff 6%,
      #127dff 8%,
      #036ffc 10%,
      #0262ee 14%,
      #0057e5 20%,
      #0054e3 24%,
      #0055eb 56%,
      #005bf5 66%,
      #026afe 76%,
      #0062ef 86%,
      #0052d6 92%,
      #0040ab 94%,
      #003092 100%
    );
    pointer-events: none;
  }

  .xp-panel__header-bg::before,
  .xp-panel__header-bg::after {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 15px;
    content: '';
  }

  .xp-panel__header-bg::before {
    left: 0;
    background: linear-gradient(to right, #1638e6 0%, transparent 100%);
  }

  .xp-panel__header-bg::after {
    right: 0;
    background: linear-gradient(to left, #1638e6 0%, transparent 100%);
  }

  .xp-panel__header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 25px;
    padding: 0 1px 0 2px;
    color: #fff;
    text-shadow: 1px 1px #000;
    font-size: 12px;
    font-weight: 700;
    font-family: Tahoma, 'Noto Sans TC', sans-serif;
  }

  .xp-panel__title {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 6px;
  }

  .xp-panel__title img {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .xp-panel__title span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .xp-panel__body {
    position: relative;
    margin-top: 3px;
    background: #ece9d8;
    border: 1px solid #0a246a;
    font-family: Tahoma, 'Noto Sans TC', sans-serif;
  }
`;
