import fs from "node:fs";
import path from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
  ".ogv": "video/ogg",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

/**
 * Handles HTTP requests for uploaded files in the /uploads directory.
 * Supports full HTTP Range streaming (206 Partial Content) for smooth HTML5 video seeking.
 */
export async function serveUploadFile(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = decodeURIComponent(url.pathname);

  if (!pathname.startsWith("/uploads/")) {
    return null;
  }

  // Strip leading /uploads/ and prevent directory traversal
  const relPath = pathname.replace(/^\/uploads\/?/, "");
  const uploadsRoot = path.resolve(process.cwd(), "uploads");
  const fullPath = path.resolve(uploadsRoot, relPath);

  if (!fullPath.startsWith(uploadsRoot)) {
    return new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const DEMO_SAMPLE_FALLBACKS: Record<string, string> = {
    "vid_sample_coding.mp4": "https://vjs.zencdn.net/v/oceans.mp4",
    "vid_sample_nature.mp4":
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    "vid_sample_animation.mp4":
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
  };

  try {
    const stats = await fs.promises.stat(fullPath);
    if (!stats.isFile()) {
      const fileName = path.basename(fullPath);
      const fallbackUrl = DEMO_SAMPLE_FALLBACKS[fileName];
      if (fallbackUrl) {
        return Response.redirect(fallbackUrl, 302);
      }
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const fileSize = stats.size;
    const rangeHeader = request.headers.get("Range") || request.headers.get("range");

    // Common CORS and caching headers for media streaming
    const baseHeaders: Record<string, string> = {
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
      "Cache-Control": "public, max-age=86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: baseHeaders });
    }

    // Handle HTTP Range header for video seeking and partial loading
    if (rangeHeader && rangeHeader.startsWith("bytes=")) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const startStr = parts[0];
      const endStr = parts[1];

      let start = startStr ? parseInt(startStr, 10) : 0;
      let end = endStr ? parseInt(endStr, 10) : fileSize - 1;

      if (isNaN(start)) start = 0;
      if (isNaN(end) || end >= fileSize) end = fileSize - 1;

      if (start > end || start >= fileSize) {
        return new Response(null, {
          status: 416,
          headers: {
            ...baseHeaders,
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const nodeStream = fs.createReadStream(fullPath, { start, end });
      const webStream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk) => controller.enqueue(chunk));
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (err) => controller.error(err));
        },
        cancel() {
          nodeStream.destroy();
        },
      });

      return new Response(webStream, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": chunkSize.toString(),
          "Content-Type": contentType,
        },
      });
    }

    // Full file response
    const nodeStream = fs.createReadStream(fullPath);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => controller.enqueue(chunk));
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new Response(webStream, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": fileSize.toString(),
        "Content-Type": contentType,
      },
    });
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      const fileName = path.basename(fullPath);
      const fallbackUrl = DEMO_SAMPLE_FALLBACKS[fileName];
      if (fallbackUrl) {
        return Response.redirect(fallbackUrl, 302);
      }
      return new Response(JSON.stringify({ error: "File not found on server storage" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("[serveUploadFile error]", err);
    return new Response(JSON.stringify({ error: "Failed to read storage file" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
