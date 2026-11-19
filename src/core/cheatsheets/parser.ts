import yaml from 'yaml';
import type { CheatsheetFrontmatter, CheatsheetItem } from './types';

function extractFrontmatter(
  content: string,
  fallbackLanguage?: string
): { frontmatter: CheatsheetFrontmatter; body: string } {
  const fallbackLang = (fallbackLanguage || '').trim().toLowerCase() || 'general';
  const fallbackBadge = fallbackLang.length <= 4 ? fallbackLang : fallbackLang.slice(0, 3);
  const trimmed = content.trimStart();
  const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!match) {
    return {
      frontmatter: {
        language: fallbackLang,
        badge: fallbackBadge,
        aliases: fallbackLang !== 'general' ? [fallbackLang] : [],
      },
      body: content,
    };
  }

  try {
    const parsed = yaml.parse(match[1]) || {};
    const language = String(parsed.language || fallbackLang).trim().toLowerCase();
    const badge = String(parsed.badge || (language.length <= 4 ? language : language.slice(0, 3))).trim().toLowerCase();

    let aliases: string[] = [];
    if (Array.isArray(parsed.aliases)) {
      aliases = parsed.aliases.map((a: unknown) => String(a).trim().toLowerCase()).filter(Boolean);
    } else if (typeof parsed.aliases === 'string') {
      aliases = parsed.aliases.split(',').map((a: string) => a.trim().toLowerCase()).filter(Boolean);
    }

    return {
      frontmatter: { language, badge, aliases },
      body: match[2],
    };
  } catch {
    return {
      frontmatter: {
        language: fallbackLang,
        badge: fallbackBadge,
        aliases: fallbackLang !== 'general' ? [fallbackLang] : [],
      },
      body: match[2] || content,
    };
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-');
}

export function parseCheatsheet(rawContent: string, fallbackLanguage?: string): CheatsheetItem[] {
  const { frontmatter, body } = extractFrontmatter(rawContent, fallbackLanguage);
  let sections = body.split(/(?:^|\r?\n)##\s+/);
  if (sections.length <= 1) {
    const singleSection = body.split(/(?:^|\r?\n)#\s+/);
    if (singleSection.length > 1) {
      sections = singleSection;
    }
  }
  const items: CheatsheetItem[] = [];
  const seenIds = new Set<string>();

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const newlineIndex = section.indexOf('\n');
    let title = '';
    let sectionBody = '';

    if (newlineIndex === -1) {
      title = section.trim();
      sectionBody = '';
    } else {
      title = section.slice(0, newlineIndex).trim();
      sectionBody = section.slice(newlineIndex + 1).trim();
    }

    if (!title) continue;

    const baseSlug = slugify(title) || `item-${i}`;
    let id = `${frontmatter.language}:${baseSlug}`;
    let counter = 1;
    while (seenIds.has(id)) {
      id = `${frontmatter.language}:${baseSlug}-${counter++}`;
    }
    seenIds.add(id);

    const fenceMatch = sectionBody.match(/```([a-zA-Z0-9_+-]+)/);
    const codeLang = fenceMatch ? fenceMatch[1].toLowerCase() : frontmatter.language;
    const aliases = frontmatter.aliases || [];
    const searchableText = `${title} ${frontmatter.language} ${aliases.join(' ')} ${sectionBody}`.toLowerCase();

    items.push({
      id,
      title,
      language: frontmatter.language,
      badge: frontmatter.badge,
      aliases,
      codeLang,
      rawMarkdown: sectionBody,
      searchableText,
    });
  }

  return items;
}
