import { Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import ScreenSaver from "./components/ScreenSaver.tsx";
import Home from "./pages/Home.tsx";
import History from "./pages/History";
// import Sport from './pages/Sport'
// import Science from './pages/Science'
// import StudentLife from './pages/StudentLife'
// import NamedRooms from './pages/NamedRooms'
// import VideoGallery from './pages/VideoGallery'
// import DiplomaGallery from './pages/DiplomaGallery'

import "./index.css";
import TeachersInstitute from "./pages/TeachersInstitute.tsx";
import Rectors from "./pages/Rectors.tsx";

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

		const events = ["mousedown", "touchstart", "keydown", "mousemove"];
		events.forEach((e) => window.addEventListener(e, handleActivity));

		startTimer();

		return () => {
			clearTimeout(timer);
			events.forEach((e) =>
				window.removeEventListener(e, handleActivity),
			);
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

		window.addEventListener("touchstart", handleTouchStart);
		window.addEventListener("touchend", handleTouchEnd);

		return () => {
			window.removeEventListener("touchstart", handleTouchStart);
			window.removeEventListener("touchend", handleTouchEnd);
		};
	}, [navigate]);

	return (
		<>
			{isIdle && <ScreenSaver onDismiss={resetTimer} />}
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/history" element={<History />} />
        <Route path="/history/development" element={<TeachersInstitute />} />
        <Route path="/history/rectors" element={<Rectors />} />
				{/* <Route path="/sport" element={<Sport />} />
        <Route path="/science" element={<Science />} />
        <Route path="/student-life" element={<StudentLife />} />
        <Route path="/named-rooms" element={<NamedRooms />} />
        <Route path="/video-gallery" element={<VideoGallery />} />
        <Route path="/diploma-gallery" element={<DiplomaGallery />} /> */}
			</Routes>
		</>
	);
}
