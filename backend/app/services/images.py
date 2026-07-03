import base64
import hashlib
import re
from pathlib import Path


ACCENTS = {
    "AI": "#7c3aed",
    "Security": "#dc2626",
    "Cloud": "#0284c7",
    "Infra": "#0f766e",
    "OSS": "#ea580c",
    "Tooling": "#2563eb",
    "Research": "#52525b",
    "RSS": "#e36100",
    "GitHub": "#171717",
    "Reddit": "#ff4500",
}


ROOT_IMAGE_DIR = Path(__file__).resolve().parents[3] / "images"

LOCAL_STOCK_IMAGES = [
    ("aws", "aws.png"),
    ("azure", "azure.png"),
    ("github", "github.png"),
    ("apple", "apple.png"),
    ("amazon", "amazon.png"),
    ("meta", "meta.jfif"),
    ("microsoft", "microsoftlogo.png"),
    ("google", "logo_Google_FullColor_3x_830x27.max-600x600.format-webp.webp"),
    ("kubernetes", "kubernetes.png"),
    ("anthropic", "anthropic.png"),
    ("android", "android.png"),
]

LABELLED_STOCK_IMAGES = {
    "brp": "official-microsoft-blog-header.jpeg",
    "microsoft": "microsoftlogo.png",
    "google": "logo_Google_FullColor_3x_830x27.max-600x600.format-webp.webp",
    "aws": "aws.png",
    "azure": "azure.png",
    "github": "github.png",
    "apple": "apple.png",
    "amazon": "amazon.png",
    "meta": "meta.jfif",
    "anthropic": "anthropic.png",
    "android": "android.png",
}

GENERIC_STOCK_IMAGES = [
    "growtika-Am6pBe2FpJw-unsplash.jpg",
    "growtika-nGoCBxiaRO0-unsplash.jpg",
    "kevin-ache-2JJ3wBHu4_0-unsplash.jpg",
    "igor-omilaev-eGGFZ5X2LnA-unsplash.jpg",
]


def generate_story_image_data_uri(title: str, label: str, accent: str | None = None) -> str:
    fill = accent or ACCENTS.get(label, "#e36100")
    safe_label = label[:28].upper()
    svg = f"""
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f7f3ee"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <circle cx="110" cy="110" r="44" fill="none" stroke="{fill}" stroke-width="8" stroke-dasharray="1 18" stroke-linecap="round"/>
      <text x="86" y="205" font-family="Arial, sans-serif" font-size="28" fill="{fill}" letter-spacing="8">{safe_label}</text>
      <circle cx="980" cy="180" r="160" fill="{fill}" opacity="0.08"/>
      <circle cx="1110" cy="360" r="110" fill="{fill}" opacity="0.10"/>
      <rect x="86" y="300" width="640" height="18" rx="9" fill="#18181b" opacity="0.12"/>
      <rect x="86" y="346" width="520" height="18" rx="9" fill="#18181b" opacity="0.10"/>
      <rect x="86" y="392" width="460" height="18" rx="9" fill="#18181b" opacity="0.08"/>
      <rect x="0" y="620" width="1280" height="100" fill="#faf7f2"/>
    </svg>
    """.strip()
    encoded = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"


def select_local_story_image(title: str, excerpt: str = "", source_name: str = "", category_name: str = "") -> str | None:
    haystack = " ".join([title, excerpt, source_name, category_name]).lower()

    for label, filename in LABELLED_STOCK_IMAGES.items():
        if label in haystack:
            candidate = ROOT_IMAGE_DIR / filename
            if candidate.exists():
                return f"/images/{filename}"

    for keyword, filename in LOCAL_STOCK_IMAGES:
        if keyword in haystack:
            candidate = ROOT_IMAGE_DIR / filename
            if candidate.exists():
                return f"/images/{filename}"

    if category_name.lower() in {"ai", "security", "cloud", "oss", "tooling", "infra"} and re.search(
        r"\b(vulnerability|outage|release|model|agent|update|incident|launch|tool|api|cve|threat|patch|risk)\b",
        haystack,
    ):
        digest = hashlib.md5(haystack.encode("utf-8")).hexdigest()
        index = int(digest[:8], 16) % len(GENERIC_STOCK_IMAGES)
        candidate = ROOT_IMAGE_DIR / GENERIC_STOCK_IMAGES[index]
        if candidate.exists():
            return f"/images/{GENERIC_STOCK_IMAGES[index]}"

    return None
