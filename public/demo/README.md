# Demo video

The `/demo` page plays a walkthrough from `<video src="...">`.

## Production (recommended)

GitHub rejects files **larger than 100MB**, so do not commit huge `.mov` / `.mp4` files.

1. Upload the file to **Vercel Blob** with **public** access (or any CDN).
2. Set in Vercel project env (and redeploy):

   `NEXT_PUBLIC_DEMO_WALKTHROUGH_URL=https://...`

3. The client reads this at build time via `NEXT_PUBLIC_*`.

## Local dev

- Optional: keep `ScoutFolio-Walkthrough.mov` under `public/demo/` on your machine.  
  `*.mov` here is **gitignored** so it will not block `git push`.
- If the env var is unset, the player falls back to  
  `/demo/ScoutFolio-Walkthrough.mov`.

## Poster

Optional: replace `walkthrough-poster.svg` with a raster poster; if you change the filename, update `POSTER_SRC` in `components/demo/demo-video.tsx`.
