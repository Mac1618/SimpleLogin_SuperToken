'use client';
import Image from 'next/image';
import { signOut } from 'supertokens-web-js/recipe/session';

export default function Home() {
	const onLogout = async () => {
		await signOut();
		window.location.href = '/auth'; // or to wherever your logic page is
	};

	return (
		<main className="">
			<h1>Hello world</h1>
			<button onClick={onLogout}>Logout</button>
		</main>
	);
}
