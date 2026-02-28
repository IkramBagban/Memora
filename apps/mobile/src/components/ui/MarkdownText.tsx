import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { Colors, Spacing, Typography } from '@memora/shared';

interface MarkdownTextProps {
  content: string;
  variant?: 'body' | 'title';
  numberOfLines?: number;
}

interface StyledSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
}

type BlockNode =
  | { type: 'heading'; level: number; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'paragraph'; text: string };

function parseInlineMarkdown(text: string): StyledSegment[] {
  const segments: StyledSegment[] = [];
  const markerPattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(markerPattern)) {
    const [value] = match;
    const index = match.index ?? 0;

    if (index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, index), bold: false, italic: false, code: false });
    }

    if (value.startsWith('**') && value.endsWith('**')) {
      segments.push({ text: value.slice(2, -2), bold: true, italic: false, code: false });
    } else if (value.startsWith('*') && value.endsWith('*')) {
      segments.push({ text: value.slice(1, -1), bold: false, italic: true, code: false });
    } else {
      segments.push({ text: value.slice(1, -1), bold: false, italic: false, code: true });
    }

    lastIndex = index + value.length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false, italic: false, code: false });
  }

  return segments.length > 0 ? segments : [{ text, bold: false, italic: false, code: false }];
}

function parseBlocks(content: string): BlockNode[] {
  const lines = content.split('\n');
  const blocks: BlockNode[] = [];
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    const trimmed = line.trim();

    if (!trimmed) {
      lineIndex += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
      lineIndex += 1;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'quote', text: trimmed.slice(2) });
      lineIndex += 1;
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.*)$/);
    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (unorderedMatch || orderedMatch) {
      const ordered = Boolean(orderedMatch);
      const items: string[] = [];

      while (lineIndex < lines.length) {
        const current = lines[lineIndex].trim();
        const listMatch = ordered ? current.match(/^\d+\.\s+(.*)$/) : current.match(/^[-*]\s+(.*)$/);

        if (!listMatch) {
          break;
        }

        items.push(listMatch[1]);
        lineIndex += 1;
      }

      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    lineIndex += 1;

    while (lineIndex < lines.length) {
      const current = lines[lineIndex].trim();
      if (!current) {
        break;
      }

      if (/^(#{1,3})\s+/.test(current) || /^>\s+/.test(current) || /^[-*]\s+/.test(current) || /^\d+\.\s+/.test(current)) {
        break;
      }

      paragraphLines.push(current);
      lineIndex += 1;
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return blocks;
}

interface InlineTextProps {
  value: string;
  textStyle: StyleProp<TextStyle>;
  numberOfLines?: number;
}

function InlineText({ value, textStyle, numberOfLines }: InlineTextProps) {
  const segments = parseInlineMarkdown(value);

  return (
    <Text style={textStyle} numberOfLines={numberOfLines}>
      {segments.map((segment, segmentIndex) => {
        const stylesToUse = [
          segment.bold ? styles.inlineBold : null,
          segment.italic ? styles.inlineItalic : null,
          segment.code ? styles.inlineCode : null,
        ];

        return (
          <Text key={`${segment.text}-${segmentIndex}`} style={stylesToUse}>
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
}

export function MarkdownText({ content, variant = 'body', numberOfLines }: MarkdownTextProps) {
  if (numberOfLines) {
    return <InlineText value={content.replace(/\n+/g, ' ')} textStyle={[styles.paragraph, variant === 'title' ? styles.title : null]} numberOfLines={numberOfLines} />;
  }

  const blocks = parseBlocks(content);

  return (
    <View style={styles.container}>
      {blocks.map((block, blockIndex) => {
        if (block.type === 'heading') {
          const headingStyles = block.level === 1 ? styles.headingOne : block.level === 2 ? styles.headingTwo : styles.headingThree;
          return <InlineText key={`heading-${blockIndex}`} value={block.text} textStyle={[styles.paragraph, headingStyles]} />;
        }

        if (block.type === 'quote') {
          return (
            <View key={`quote-${blockIndex}`} style={styles.quoteWrap}>
              <InlineText value={block.text} textStyle={[styles.paragraph, styles.quoteText]} />
            </View>
          );
        }

        if (block.type === 'list') {
          return (
            <View key={`list-${blockIndex}`} style={styles.listWrap}>
              {block.items.map((item, itemIndex) => {
                const prefix = block.ordered ? `${itemIndex + 1}.` : '\u2022';
                return (
                  <View key={`${item}-${itemIndex}`} style={styles.listItem}>
                    <Text style={styles.listPrefix}>{prefix}</Text>
                    <InlineText value={item} textStyle={styles.paragraph} />
                  </View>
                );
              })}
            </View>
          );
        }

        return <InlineText key={`paragraph-${blockIndex}`} value={block.text} textStyle={styles.paragraph} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.sm,
  },
  paragraph: {
    color: Colors.textPrimary,
    fontSize: Typography.size.lg,
    lineHeight: Typography.size.lg * Typography.lineHeight.normal,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
  },
  headingOne: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
  },
  headingTwo: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  headingThree: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  quoteWrap: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.border,
    paddingLeft: Spacing.sm,
  },
  quoteText: {
    color: Colors.textSecondary,
  },
  listWrap: {
    gap: Spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  listPrefix: {
    color: Colors.textSecondary,
    fontSize: Typography.size.lg,
    lineHeight: Typography.size.lg * Typography.lineHeight.normal,
  },
  inlineBold: {
    fontWeight: Typography.weight.bold,
  },
  inlineItalic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    backgroundColor: Colors.background,
    color: Colors.primaryDark,
    fontSize: Typography.size.md,
  },
});
