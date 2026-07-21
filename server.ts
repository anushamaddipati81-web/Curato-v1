import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON body parsing for state logging
  app.use(express.json());

  // Simple server-side in-memory cache to prevent redundant external fetches
  const imageCache = new Map<string, string>();

  // In-memory store or file writer for client-side runtime logs
  let latestClientState: any = null;

  app.post("/api/log-state", (req, res) => {
    latestClientState = req.body;
    console.log("=== RECEIVED CLIENT RUNTIME STATE ===");
    console.log(JSON.stringify(latestClientState, null, 2));
    res.json({ ok: true });
  });

  app.get("/api/get-logged-state", (req, res) => {
    res.json(latestClientState || { error: "No state logged yet" });
  });

  // API Route to resolve actual product image from retailer URL via og:image metadata scraping
  app.get("/api/resolve-image", async (req, res) => {
    const productUrl = req.query.url as string;
    const titleQuery = (req.query.title as string) || "";
    const brandQuery = (req.query.brand as string) || "";
    const tagsQuery = (req.query.tags as string) || "";
    const tags = tagsQuery ? tagsQuery.split(",") : [];

    if (!productUrl) {
      return res.status(400).json({ error: "Product URL query parameter is required" });
    }

    try {
      // Return cached image if available
      if (imageCache.has(productUrl)) {
        return res.json({ image: imageCache.get(productUrl) });
      }

      console.log(`[Image Resolver] Resolving retailer image for: ${productUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      // Fetch retailer page using real browser headers to bypass generic bot protection layers
      const response = await fetch(productUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();

      // Regular expressions to extract standard og:image and twitter:image meta tags
      const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                          html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
      
      const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
                                html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i);

      // JSON-LD or microdata pattern fallback
      const ldJsonMatch = html.match(/"image":\s*["']([^"']+)["']/i);

      let resolvedImage = "";

      if (ogImageMatch && ogImageMatch[1]) {
        resolvedImage = ogImageMatch[1];
      } else if (twitterImageMatch && twitterImageMatch[1]) {
        resolvedImage = twitterImageMatch[1];
      } else if (ldJsonMatch && ldJsonMatch[1]) {
        resolvedImage = ldJsonMatch[1];
      }

      // Convert relative protocol URLs if needed
      if (resolvedImage && resolvedImage.startsWith("//")) {
        resolvedImage = "https:" + resolvedImage;
      }

      // Decode HTML entities if present
      if (resolvedImage) {
        resolvedImage = resolvedImage
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, "/");

        // Simple URL validation
        try {
          new URL(resolvedImage);
          // Cache successful result
          imageCache.set(productUrl, resolvedImage);
          console.log(`[Image Resolver] Successfully resolved image: ${resolvedImage}`);
          return res.json({ image: resolvedImage });
        } catch {
          console.warn(`[Image Resolver] Resolved invalid image URL: ${resolvedImage}`);
        }
      }

      console.log(`[Image Resolver] Scraper returned no metadata for ${productUrl}`);
      return res.status(404).json({ error: "Exact retailer image could not be verified" });

    } catch (err: any) {
      console.warn(`[Image Resolver] Failed resolving ${productUrl}:`, err?.message || err);
      return res.status(404).json({ error: "Exact retailer image could not be verified" });
    }
  });

  // Vite development middleware integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
