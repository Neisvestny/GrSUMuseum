import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { appRoutes } from './app/routes';
import './index.css';

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 минут

export default function App() {
	const [, setIsIdle] = useState(false);

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout>;

		const startTimer = () => {
			clearTimeout(timer);
			timer = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);
		};

		const handleActivity = () => {
			startTimer();
		};

		const events = ['mousedown', 'touchstart', 'keydown', 'mousemove'];
		events.forEach((e) => window.addEventListener(e, handleActivity));

		startTimer();

		return () => {
			clearTimeout(timer);
			events.forEach((e) => window.removeEventListener(e, handleActivity));
		};
	}, []);

	const navigate = useNavigate();

	const touchStartX = useRef(0);
	const touchEndX = useRef(0);

	const MIN_SWIPE_DISTANCE = 80; // минимальная дистанция свайпа

	useEffect(() => {
		const handleTouchStart = (e: TouchEvent) => {
			touchStartX.current = e.changedTouches[0].screenX;
		};

		const handleTouchEnd = (e: TouchEvent) => {
			touchEndX.current = e.changedTouches[0].screenX;

			const distance = touchEndX.current - touchStartX.current;

			// свайп слева направо
			if (distance > MIN_SWIPE_DISTANCE) {
				navigate(-1);
			}
		};

		window.addEventListener('touchstart', handleTouchStart);
		window.addEventListener('touchend', handleTouchEnd);

		return () => {
			window.removeEventListener('touchstart', handleTouchStart);
			window.removeEventListener('touchend', handleTouchEnd);
		};
	}, [navigate]);

	return (
		<>
			<Routes>
				{appRoutes.map((route) => (
					<Route key={route.path} path={route.path} element={route.element} />
				))}
			</Routes>
		</>
	);
}
