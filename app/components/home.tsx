import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSSRSession } from 'supertokens-node/nextjs';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { ensureSuperTokensInit } from '../config/backend';
import { SessionAuthForNextJS } from './sessionAuthForNextJS';
import { TryRefreshComponent } from './tryRefreshClientComponent';

ensureSuperTokensInit();

async function getSSRSessionHelper(): Promise<{
	session: SessionContainer | undefined;
	hasToken: boolean;
	hasInvalidClaims: boolean;
	error: Error | undefined;
}> {
	let session: SessionContainer | undefined;
	let hasToken = false;
	let hasInvalidClaims = false;
	let error: Error | undefined = undefined;

	try {
		({ session, hasToken, hasInvalidClaims } = await getSSRSession(cookies().getAll(), headers()));
	} catch (err: any) {
		error = err;
	}
	return { session, hasToken, hasInvalidClaims, error };
}

export async function HomePage() {
	const { session, hasToken, hasInvalidClaims, error } = await getSSRSessionHelper();

	if (error) {
		return <div>Something went wrong while trying to get the session. Error - {error.message}</div>;
	}

	if (!session) {
		if (!hasToken) {
			return redirect('/auth');
		}

		if (hasInvalidClaims) {
			return <SessionAuthForNextJS />;
		} else {
			// To learn about why the 'key' attribute is required refer to: https://github.com/supertokens/supertokens-node/issues/826#issuecomment-2092144048
			return <TryRefreshComponent key={Date.now()} />;
		}
	}

	const userInfoResponse = await fetch('http://localhost:3000/api/user', {
		headers: {
			/**
			 * We read the access token from the session and use that as a Bearer token when
			 * making network requests.
			 */
			Authorization: 'Bearer ' + session.getAccessToken(),
		},
	});

	let message = '';

	if (userInfoResponse.status === 200) {
		message = `Your user id is: ${session.getUserId()}`;
	} else if (userInfoResponse.status === 500) {
		message = 'Something went wrong';
	} else if (userInfoResponse.status === 401) {
		// The TryRefreshComponent will try to refresh the session
		// To learn about why the 'key' attribute is required refer to: https://github.com/supertokens/supertokens-node/issues/826#issuecomment-2092144048
		return <TryRefreshComponent key={Date.now()} />;
	} else if (userInfoResponse.status === 403) {
		// SessionAuthForNextJS will redirect based on which claim is invalid
		return <SessionAuthForNextJS />;
	}

	// You can use `userInfoResponse` to read the users session information

	return (
		<SessionAuthForNextJS>
			<div>{message}</div>
		</SessionAuthForNextJS>
	);
}
