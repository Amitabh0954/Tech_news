# API Design

Base path: `/api/v1`

## News

### `GET /news`

Query params:

- `category`
- `urgency`
- `q`
- `page`
- `page_size`

Returns paginated articles ranked for engineering relevance.

### `GET /news/{slug}`

Returns article detail, structured summary, and impact metadata.

## Taxonomy

### `GET /categories`

Returns supported editorial categories.

### `GET /sources`

Returns configured sources and trust metadata.

## Signals

### `GET /critical`

Returns urgent or critical-impact stories.

### `GET /trending`

Returns trending engineering discussion topics.

## Search

### `GET /search`

Keyword search today, semantic search later through the same endpoint contract.

## Bookmarks

### `GET /bookmarks`

Returns user bookmarks.

### `POST /bookmarks`

Creates a bookmark for the authenticated user.

## Summaries

### `GET /summaries/{article_id}`

Returns the AI summary payload for an article.

## Authentication

### `POST /auth/login`

Returns an access token and user profile.

### `POST /auth/register`

Creates a new user account.

### `GET /auth/me`

Returns the authenticated user profile.
