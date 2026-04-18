import { useCallback, useEffect, useRef, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import ScreenSaver from './components/ScreenSaver.tsx';
import './index.css';
import AdminPanel from './pages/AdminPanel.tsx';
import History from './pages/history/History.tsx';
import Memory from './pages/history/Memory.tsx';
import MemoryAfgan from './pages/history/MemoryAfgan.tsx';
import MemoryVov from './pages/history/MemoryVov.tsx';
import Rectors from './pages/history/Rectors.tsx';
import TeachersInstitute from './pages/history/TeachersInstitute.tsx';
import Home from './pages/Home.tsx';
import PhotoGallery from './pages/PhotoGallery.tsx';
import RectorDetails from './pages/RectorDetails.tsx';
import RectorsAdmin from './pages/RectorsAdmin.tsx';
import VideoGallery from './pages/VideoGallery.tsx';

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 минут

export default function App() {
	const [isIdle, setIsIdle] = useState(false);

	const resetTimer = useCallback(() => {
		setIsIdle(false);
	}, []);

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
			{isIdle && <ScreenSaver onDismiss={resetTimer} />}
			<Routes>
				<Route path="/admin" element={<AdminPanel />} />

				<Route path="/" element={<Home />} />
				<Route path="/history" element={<History />} />
				<Route path="/history/development" element={<TeachersInstitute />} />
				<Route path="/history/rectors" element={<Rectors />} />
				<Route path="/history/rectors/:id" element={<RectorDetails />} />
				<Route path="/history/memory" element={<Memory />} />
				<Route path="/history/memory/afgan" element={<MemoryAfgan />} />
				<Route path="/history/memory/vov" element={<MemoryVov />} />
				<Route path="/gallery" element={<PhotoGallery />} />
				<Route path="/video-gallery" element={<VideoGallery />} />
				<Route path="/radmin" element={<RectorsAdmin />} />
				{/* <Route path="/sport" element={<Sport />} />
        <Route path="/science" element={<Science />} />
        <Route path="/student-life" element={<StudentLife />} />
        <Route path="/named-rooms" element={<NamedRooms />} />
        <Route path="/video-gallery" element={<VideoGallery />} /> */}
			</Routes>
		</>
	);
}
