import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  console.log('\n=== TEST ENDPOINT ===');

  try {
    const request = context.request;

    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);

    // Log all headers
    console.log('Headers received:');
    for (const [key, value] of request.headers) {
      console.log(`  ${key}: ${value}`);
    }

    // Try to get body
    console.log('\nAttempting to read body...');
    const bodyText = await request.text();
    console.log('Body text length:', bodyText.length);
    console.log('Body text:', bodyText);

    if (bodyText) {
      const body = JSON.parse(bodyText);
      console.log('✓ Parsed body:', body);
      return new Response(JSON.stringify({ success: true, received: body }), { status: 200 });
    } else {
      console.log('⚠ Body is empty');
      return new Response(JSON.stringify({ success: false, body: 'empty' }), { status: 200 });
    }
  } catch (error) {
    console.error('Test endpoint error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};
