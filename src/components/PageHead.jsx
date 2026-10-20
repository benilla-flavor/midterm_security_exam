import React from 'react';

export default function PageHead({ title, lede, actions }) {
  return (
    <header className="page-head">
      <div>
        <h1 className="title">{title}</h1>
        {lede && <p className="lede">{lede}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
