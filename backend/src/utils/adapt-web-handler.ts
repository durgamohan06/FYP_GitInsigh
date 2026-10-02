import type { Request, Response } from "express";

/**
 * Adapts an existing Web API-style handler (Request → Response) to Express.
 *
 * Our existing service functions (e.g. handleGetRepos) use:
 *   function handler(request: Request): Promise<Response>
 *
 * where Request/Response are the Web API fetch types.
 * This adapter bridges them to Express req/res without rewriting all handlers.
 */
export function adaptWebHandler(
  handler: (webReq: globalThis.Request) => Promise<globalThis.Response> | globalThis.Response,
) {
  return async (req: Request, res: Response): Promise<void> => {
    // Build Web API Request from Express req
    const protocol = req.protocol ?? "http";
    const host = req.headers.host ?? "localhost:3001";
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    const webReq = new globalThis.Request(fullUrl, {
      method: req.method,
      headers: buildHeaders(req),
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const webRes = await handler(webReq);

    // Forward status
    res.status(webRes.status);

    // Forward headers (except ones Express manages)
    const skipHeaders = new Set(["content-encoding", "transfer-encoding"]);
    webRes.headers.forEach((value, key) => {
      if (!skipHeaders.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // Forward body
    const contentType = webRes.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      res.send(await webRes.text());
    } else {
      const body = await webRes.text();
      res.send(body);
    }
  };
}

function buildHeaders(req: Request): HeadersInit {
  const headers: Record<string, string> = {};
  for (const [key, val] of Object.entries(req.headers)) {
    if (val !== undefined) {
      headers[key] = Array.isArray(val) ? val.join(", ") : val;
    }
  }
  return headers;
}
