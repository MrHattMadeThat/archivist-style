// Enhance a paragraph in place so emphasis, punctuation and the original wording survive.
(() => {
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('en', { granularity: 'sentence' }) : null;
  const words = /[\p{L}\p{M}\p{N}]+(?:[’'‑-][\p{L}\p{M}\p{N}]+)*/gu;
  const help = 'Select a word to hear it. Use ▶ to hear its sentence.';

  function sentences(text) {
    const result = [];
    let pending = '';
    const parts = segmenter ? Array.from(segmenter.segment(text), s => s.segment)
      : text.match(/[^.!?]+[.!?]*[”’"']*\s*|[.!?]+\s*/gu) || [];
    for (const segment of parts) {
      pending += segment;
      if (/\b(?:Mr|Mrs|Ms|Dr|St|No|ca|c)\.\s*$/i.test(pending)) continue;
      result.push(pending);
      pending = '';
    }
    if (pending) result.push(pending);
    return result;
  }

  function attach(root, speaker) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const text = root.textContent;
    let offset = 0;
    const ends = new Map();
    for (const sentence of sentences(text)) {
      if (sentence.trim()) ends.set(offset + sentence.trimEnd().length, sentence.trim());
      offset += sentence.length;
    }
    offset = 0;
    const buttons = [];
    function control(label, spoken, kind) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hear-' + kind;
      b.textContent = label;
      if (kind === 'sentence') {
        b.setAttribute('aria-label', 'Read sentence: ' + spoken);
        b.title = 'Read this sentence aloud';
      } else {
        b.tabIndex = buttons.length ? -1 : 0;
        buttons.push(b);
        b.onkeydown = event => {
          const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
          if (!step) return;
          event.preventDefault();
          event.stopPropagation();
          const target = buttons[buttons.indexOf(b) + step];
          if (target) { b.tabIndex = -1; target.tabIndex = 0; target.focus(); }
        };
        b.onfocus = () => {
          for (const word of buttons) word.tabIndex = word === b ? 0 : -1;
        };
      }
      b.onclick = event => {
        event.stopPropagation();
        window.MuseumAudio.speak(speaker, spoken, { requested: true });
      };
      return b;
    }
    for (const node of nodes) {
      const value = node.data;
      const fragment = document.createDocumentFragment();
      let start = 0;
      function appendPart(end) {
        const part = value.slice(start, end);
        let i = 0;
        for (const word of part.matchAll(words)) {
          fragment.append(part.slice(i, word.index), control(word[0], word[0], 'word'));
          i = word.index + word[0].length;
        }
        fragment.append(part.slice(i));
        start = end;
      }
      for (const [end, sentence] of ends) {
        if (end <= offset || end > offset + value.length) continue;
        appendPart(end - offset);
        fragment.append(control('▶', sentence, 'sentence'));
      }
      appendPart(value.length);
      node.replaceWith(fragment);
      offset += value.length;
    }
  }
  window.ReadAloud = { attach, help };
})();
