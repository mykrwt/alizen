import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel free tier allows up to 60s

/**
 * Thin streaming proxy for providers that don't allow CORS from browsers
 * (notably OpenAI and Groq).
 *
 * IMPORTANT: This proxy DOES NOT use a server-side API key. The user's API
 * key is forwarded in the Authorization header exactly as it would be sent
 * directly from the browser. Alizen never pays for inference — this proxy
 * exists solely to work around browser CORS restrictions, and works within
 * Vercel's generous free tier (100k+ invocations/day, 100 GB bandwidth/month).
 *
 * Response streaming is preserved end-to-end.
 */
export async function POST(req: NextRequest) {
  try {
    const target =
      req.headers.get('X-Target-URL') ||
      req.nextUrl.searchParams.get('target');

    if (!target) {
      return NextResponse.json(
        { error: 'Missing target URL' },
        { status: 400 }
      );
    }

    // Validate target is a safe HTTPS URL (not internal/private)
    let targetUrl: URL;
    try {
      targetUrl = new URL(target);
    } catch {
      return NextResponse.json({ error: 'Invalid target URL' }, { status: 400 });
    }
    if (targetUrl.protocol !== 'https:') {
      // Allow http for custom localhost development — but in production Vercel
      // is https and localhost won't apply.
      if (
        process.env.NODE_ENV === 'production' &&
        !targetUrl.hostname.startsWith('127.0.0.1') &&
        !targetUrl.hostname.startsWith('localhost')
      ) {
        return NextResponse.json(
          { error: 'Only HTTPS targets are allowed in production' },
          { status: 400 }
        );
      }
    }

    // Disallow obvious SSRF targets
    const badHosts = ['169.254.169.254', 'metadata.google.internal', '0.0.0.0'];
    if (badHosts.some((h) => targetUrl.hostname === h || targetUrl.hostname.endsWith('.' + h))) {
      return NextResponse.json({ error: 'Forbidden target' }, { status: 403 });
    }

    // Copy headers except host / connection / origin / referer / cookies
    const forwardHeaders = new Headers();
    req.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (
        k === 'host' ||
        k === 'connection' ||
        k === 'origin' ||
        k === 'referer' ||
        k === 'cookie' ||
        k === 'x-target-url' ||
        k === 'x-provider' ||
        k.startsWith('x-forwarded-') ||
        k.startsWith('x-vercel-')
      ) {
        return;
      }
      forwardHeaders.set(key, value);
    });

    const body = await req.arrayBuffer();

    const upstream = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers: forwardHeaders,
      body,
      // @ts-ignore
      duplex: 'half',
    });

    // Stream the response back
    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (
        k === 'content-encoding' ||
        k === 'content-length' ||
        k === 'transfer-encoding' ||
        k === 'connection'
      ) {
        return;
      }
      responseHeaders.set(key, value);
    });
    responseHeaders.set('Cache-Control', 'no-cache');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Proxy error', message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Target-URL, X-Provider',
      'Access-Control-Max-Age': '86400',
    },
  });
}
