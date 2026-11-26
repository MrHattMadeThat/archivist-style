export const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

export const button = (cls, text) => {
  const b = el('button', cls, text);
  b.type = 'button';
  return b;
};
