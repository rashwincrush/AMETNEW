# Vercel Region Evidence

## How to read Vercel headers
- `x-vercel-id`: Encodes the edge region and function execution region that served the request. For example, `bom1::` indicates the Mumbai edge POP; when functions run, the suffix also reflects the execution region. (Per Vercel docs: the first segment maps to the edge/region that handled the request.)
- Region mapping: `bom1` → Mumbai POP (maps to AWS ap-south-1 locality).
- `x-vercel-cache`: Cache status at the edge. Common values:
  - `HIT`: Response was served from Vercel edge cache (no origin/function execution this request).
  - `MISS`: Not in cache; fetched from origin and cached.
  - `STALE`: Served stale while revalidating.
  - `BYPASS`: Cache bypassed.

## Owner Evidence (paste production response headers)
Provide a recent production response (HTML or asset) showing these headers:
- `x-vercel-id: ______________________________`
- `x-vercel-cache: ____________________________`
- `date: _____________________________________`
- `etag: _____________________________________`
- `last-modified: _____________________________`

Notes:
- Capture headers from a live production request (curl or browser devtools -> Network tab).
- If multiple regions appear (multi-POP), include representative samples.
