import MarkdownIt, { type Token } from 'markdown-it';

/**
 * النص المرئي لـ Markdown: ما يظهر للمستخدم في العرض (بدون علامات التنسيق).
 *
 * الغرض: مقارنة اقتباسات evidence بالمصدر بتسامح محصور في علامات العرض فقط
 * (backticks/strong/emphasis/روابط/NBSP)، مع بقاء أي شيء آخر حرفيًا كما هو.
 *
 * ملاحظات السلوك:
 * - html موقوف: الوسوم النصية مثل <h1> تبقى ضمن النص كما وردت (كما يفعل العرض حين
 *   تكون داخل code)، بينما لا تُفسر كعناصر.
 * - الروابط تُحوَّل إلى نص الرابط؛ URL يسقط (موجود في attrs فقط).
 * - محتوى inline code وcode fences يبقى حرفيًا بما فيه `_` و`*`؛ تُزال المحارف المحدِّدة فقط.
 * - الكيانات مثل &amp; تُفك إلى محارفها المرئية (يفعلها المحلل نفسه).
 */

const md = new MarkdownIt('default', { html: false, linkify: false, typographer: false });

export function visibleText(markdown: string): string {
  const tokens = md.parse(markdown, {});
  const parts: string[] = [];

  const walk = (list: Token[]): void => {
    for (const token of list) {
      switch (token.type) {
        case 'inline':
          if (token.children) walk(token.children);
          break;
        case 'text':
        case 'code_inline':
          // نص عادي أو محتوى inline code: المحتوى كما هو، بلا محارف التنسيق
          parts.push(token.content);
          break;
        case 'softbreak':
        case 'hardbreak':
          parts.push(' ');
          break;
        case 'fence':
        case 'code_block':
          // محتوى كتل الشفرة حرفيًا بما فيه الرموز
          parts.push(token.content);
          break;
        case 'image':
          // النص المرئي للصورة هو alt
          if (token.children) walk(token.children);
          break;
        default:
          // link_open/close (URL في attrs فقط)، عناوين البلوكات، html_block ... تُتجاهل
          break;
      }
    }
  };

  walk(tokens);
  return parts.join('');
}
