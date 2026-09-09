import React from 'react';

interface FormattedMessageProps {
  content: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
  if (!content) return null;

  // Split content into blocks by double newlines or single newlines
  const lines = content.split('\n');

  const renderInlineFormatted = (text: string) => {
    // Process bold, italic, code
    const parts: React.ReactNode[] = [];
    // Regex for bold **text**, italic *text*, inline code `code`
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={match.index} className="font-semibold text-white">{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={match.index} className="italic text-neutral-200">{token.slice(1, -1)}</em>);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={match.index} className="bg-neutral-900 border border-neutral-700 text-red-400 px-1.5 py-0.5 rounded text-xs font-mono">
            {token.slice(1, -1)}
          </code>
        );
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = (keyPrefix: number) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${keyPrefix}`} className="space-y-1.5 my-2 pl-2">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(i);
      continue;
    }

    // Bullet points: * or -
    const bulletMatch = trimmed.match(/^(\*|-)\s+(.*)$/);
    if (bulletMatch) {
      inList = true;
      listItems.push(
        <li key={`li-${i}`} className="flex items-start gap-2 text-neutral-200 leading-relaxed">
          <span className="text-red-500 font-bold select-none mt-0.5">•</span>
          <span className="flex-1">{renderInlineFormatted(bulletMatch[2])}</span>
        </li>
      );
      continue;
    }

    // Numbered list: 1. 2.
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      flushList(i);
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 text-neutral-200 leading-relaxed my-1 pl-1">
          <span className="text-red-400 font-mono text-xs font-semibold select-none mt-1 min-w-[18px]">
            {numberedMatch[1]}.
          </span>
          <span className="flex-1">{renderInlineFormatted(numberedMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Headers: ### ## #
    const headerMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headerMatch) {
      flushList(i);
      const level = headerMatch[1].length;
      if (level === 1) {
        elements.push(
          <h3 key={`h1-${i}`} className="text-base font-bold text-white mt-3 mb-1.5 border-b border-neutral-800 pb-1">
            {renderInlineFormatted(headerMatch[2])}
          </h3>
        );
      } else if (level === 2) {
        elements.push(
          <h4 key={`h2-${i}`} className="text-sm font-semibold text-white mt-2.5 mb-1 text-red-300">
            {renderInlineFormatted(headerMatch[2])}
          </h4>
        );
      } else {
        elements.push(
          <h5 key={`h3-${i}`} className="text-xs font-medium text-neutral-300 mt-2 mb-0.5">
            {renderInlineFormatted(headerMatch[2])}
          </h5>
        );
      }
      continue;
    }

    // Regular paragraph
    flushList(i);
    elements.push(
      <p key={`p-${i}`} className="text-neutral-200 leading-relaxed my-1">
        {renderInlineFormatted(trimmed)}
      </p>
    );
  }

  flushList(lines.length);

  return <div className="space-y-1">{elements}</div>;
};
