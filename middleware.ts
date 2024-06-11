import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withSession } from 'supertokens-node/nextjs';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { ensureSuperTokensInit } from './app/config/backend';

ensureSuperTokensInit();

export async function middleware(request: NextRequest & { session?: SessionContainer }) {
	if (request.headers.has('x-user-id')) {
		console.warn(
			'The FE tried to pass x-user-id, which is only supposed to be a backend internal header. Ignoring.'
		);
		request.headers.delete('x-user-id');
	}

	if (request.nextUrl.pathname.startsWith('/api/auth')) {
		/**
		 * /api/auth/* endpoints are exposed by the SuperTokens SDK,
		 * we do not want to modify the request for these routes
		 */
		return NextResponse.next();
	}

	return withSession(request, async (err, session) => {
		if (err) {
			return NextResponse.json(err, { status: 500 });
		}
		if (session === undefined) {
			return NextResponse.next();
		}
		return NextResponse.next({
			headers: {
				// You cannot attach the full session object here
				'x-user-id': session.getUserId(),
			},
		});
	});
}

export const config = {
	matcher: '/api/:path*',
};
