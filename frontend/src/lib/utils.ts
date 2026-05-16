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
    });
  });

  return document.body.innerHTML;
}
