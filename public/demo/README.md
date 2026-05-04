# Demo video drop point

The `/demo` page expects a walkthrough video at:

```
public/demo/walkthrough.mp4
```

Drop any mp4 here with that exact filename and it will play on the page. If the file is missing, the player shows a fallback explaining where to put it.

Optional: replace `walkthrough-poster.svg` with a JPG/PNG poster frame at the same path (update the import in `components/demo/demo-video.tsx` if you change the extension).
