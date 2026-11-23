export function firstParagraph(markdown: string): string {
    const blocks = markdown.replace(/\r\n/g, '\n').split(/\n\s*\n/).map(block => block.trim());
    const paragraph = blocks.find(block => block && !block.startsWith('#') && !block.startsWith('[') && !block.startsWith('<') && !block.startsWith('|') && !block.startsWith('-'));
    if (!paragraph) return '';
    return paragraph.replace(/\s*\n\s*/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/`([^`]+)`/g, '$1').trim();
}
