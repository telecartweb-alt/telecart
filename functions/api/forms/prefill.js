import { getSupabaseAdmin } from '../../helpers/supabase.js';
import { validateZohoPrefillToken, markZohoPrefillTokenUsed } from '../../helpers/zohoTokens.js';
import { jsonResponse } from '../../helpers/utils.js';

async function handlePrefill(token, env) {
    const validationResult = token ? 'token provided' : 'token missing';
    console.log('[prefill] validation result:', validationResult);

    if (!token) {
        const response = jsonResponse({ success: false, message: 'Invalid or expired token' }, 400);
        console.log('[prefill] response status:', response.status);
        return response;
    }

    try {
        const tokenRecord = await validateZohoPrefillToken({ env, token, allowUsed: true });
        if (!tokenRecord) {
            const response = jsonResponse({ success: false, message: 'Invalid or expired token' }, 400);
            console.log('[prefill] validation result: token invalid');
            console.log('[prefill] response status:', response.status);
            return response;
        }

        const supabase = getSupabaseAdmin(env);
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('email, full_name, company_name, phone, first_name, last_name')
            .eq('id', tokenRecord.userId)
            .single();

        if (userError || !user) {
            console.error('Failed to load Zoho prefill user from Supabase:', userError);
            return jsonResponse({ success: false, message: 'Unable to load user data' }, 500);
        }

        await markZohoPrefillTokenUsed({ env, token });

        const responsePayload = {
            firstName: user.first_name ?? '',
            lastName: user.last_name ?? '',
            name: user.full_name || '',
            email: user.email || '',
            phone: user.phone || '',
            companyName: user.company_name || '',
        };

        console.log('[prefill] response field existence:', {
            firstNameExists: user.first_name != null && user.first_name !== '',
            lastNameExists: user.last_name != null && user.last_name !== '',
        });
        console.log('[prefill] response fields:', Object.keys(responsePayload));

        const response = jsonResponse(responsePayload);
        console.log('[prefill] response status:', response.status);
        return response;
    } catch (error) {
        console.error('Zoho prefilling webhook error:', error);
        return jsonResponse({ success: false, message: 'Internal server error' }, 500);
    }
}

async function getPostToken(request) {
    const contentType = request.headers.get('content-type') || '';
    const trimmedContentType = contentType.toLowerCase();

    if (trimmedContentType.includes('application/json')) {
        try {
            const body = await request.json();
            return typeof body?.token === 'string' ? body.token : undefined;
        } catch (error) {
            console.warn('[prefill] unable to parse JSON body:', error?.message ?? error);
            return undefined;
        }
    }

    const text = await request.text();
    try {
        const body = JSON.parse(text);
        return typeof body?.token === 'string' ? body.token : undefined;
    } catch {
        const params = new URLSearchParams(text);
        return params.get('token') ?? undefined;
    }
}

export async function onRequestGet({ request, env }) {
    console.log('[prefill] REQUEST RECEIVED');
    console.log('[prefill] method:', request.method);
    const token = new URL(request.url).searchParams.get('token');
    console.log('[prefill] token source: query');
    console.log('[prefill] token present:', Boolean(token));
    return handlePrefill(token, env);
}

export async function onRequestPost({ request, env }) {
    console.log('[prefill] REQUEST RECEIVED');
    console.log('[prefill] method:', request.method);
    const url = new URL(request.url);
    const queryToken = url.searchParams.get('token');
    const bodyToken = await getPostToken(request);
    const token = queryToken || bodyToken;
    const tokenSource = queryToken ? 'query' : bodyToken ? 'body' : 'none';
    console.log('[prefill] token source:', tokenSource);
    console.log('[prefill] token present:', Boolean(token));
    return handlePrefill(token, env);
}
