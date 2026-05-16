import base64


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
