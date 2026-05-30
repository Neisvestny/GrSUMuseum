import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ScreenSaver from './components/ScreenSaver';
import { appRoutes } from './app/routes';
import './index.css';

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 минут

function isAdminPath(pathname: string): boolean {
	return pathname === '/admin' || pathname.startsWith('/admin/');
}

export default function App() {
	const [isIdle, setIsIdle] = useState(false);
	const location = useLocation();
	const navigate = useNavigate();
	const isAdminRoute = isAdminPath(location.pathname);

	useEffect(() => {
		if (isAdminRoute) {
			setIsIdle(false);
			return;
		}

		let timer: ReturnType<typeof setTimeout>;

		const startTimer = () => {
			clearTimeout(timer);
			timer = setTimeout(() => {
				navigate('/', { replace: true });
				setIsIdle(true);
			}, IDLE_TIMEOUT);
		};

		const handleActivity = () => {
			setIsIdle(false);
			startTimer();
		};

		const events = ['mousedown', 'touchstart', 'keydown', 'mousemove'];
		events.forEach((e) => window.addEventListener(e, handleActivity));

		startTimer();

		return () => {
			clearTimeout(timer);
			events.forEach((e) => window.removeEventListener(e, handleActivity));
		};
	}, [isAdminRoute, navigate]);

	const touchStartX = useRef(0);
	const touchEndX = useRef(0);

	const MIN_SWIPE_DISTANCE = 80;

	useEffect(() => {
		const handleTouchStart = (e: TouchEvent) => {
			touchStartX.current = e.changedTouches[0].screenX;
		};

		const handleTouchEnd = (e: TouchEvent) => {
			touchEndX.current = e.changedTouches[0].screenX;

			const distance = touchEndX.current - touchStartX.current;

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
			{isIdle && !isAdminRoute && (
				<ScreenSaver
					onDismiss={() => {
						setIsIdle(false);
					}}
				/>
			)}
			<Routes>
				{appRoutes.map((route) => (
					<Route key={route.path} path={route.path} element={route.element} />
				))}
			</Routes>
		</>
	);
}
