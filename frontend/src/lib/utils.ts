import { clsx } from "clsx";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function sanitizeFeedHtml(html?: string | null) {
  if (!html || typeof window === "undefined") {
    return "";
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  document.querySelectorAll("script, style, iframe, object, embed").forEach((node) => node.remove());

  document.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.toLowerCase();
      if (name.startsWith("on") || value.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
      // Inline style/width/height attributes on feed-sourced <img> tags routinely carry
      // dimensions from the original site's layout (or a stale/mismatched CMS default)
      // that has nothing to do with the image's real aspect ratio. Inline styles beat
      // any stylesheet rule we write, so leaving them in place is what causes stretched/
      // squished images in article bodies — strip them and let our own CSS size images.
      if (name === "style" || (element.tagName === "IMG" && (name === "width" || name === "height"))) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return document.body.innerHTML;
}
