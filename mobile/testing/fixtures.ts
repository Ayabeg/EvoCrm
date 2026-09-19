import authTokenSuccess from '@/testing/fixtures/auth-token-success.json';
import meSuccess from '@/testing/fixtures/me-success.json';
import error401 from '@/testing/fixtures/error-401.json';
import error403 from '@/testing/fixtures/error-403.json';
import error403Unverified from '@/testing/fixtures/error-403-unverified.json';
import error404 from '@/testing/fixtures/error-404.json';
import error422 from '@/testing/fixtures/error-422.json';
import error429 from '@/testing/fixtures/error-429.json';
import error500 from '@/testing/fixtures/error-500.json';

export const fixtures = {
  authTokenSuccess,
  meSuccess,
  error401,
  error403,
  error403Unverified,
  error404,
  error422,
  error429,
  error500,
};

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function emptyResponse(status: number): Response {
  return new Response(null, { status });
}
