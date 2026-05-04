import type { ReactElement } from 'react';
import AdminPanel from '../pages/AdminPanel';
import CmsDynamicPage from '../pages/CmsDynamicPage';
import DynamicSectionMenuPage from '../pages/DynamicSectionMenuPage';
import Home from '../pages/Home';

export type AppRoute = {
	path: string;
	element: ReactElement;
};

export const appRoutes: AppRoute[] = [
	{ path: '/admin', element: <AdminPanel /> },
	{ path: '/', element: <Home /> },
	// { path: '/history', element: <History /> },
	// { path: '/history/development', element: <TeachersInstitute /> },
	// { path: '/history/rectors', element: <Rectors /> },
	// { path: '/history/rectors/:id', element: <RectorDetails /> },
	// { path: '/history/memory', element: <Memory /> },
	// { path: '/history/memory/afgan', element: <MemoryAfgan /> },
	// { path: '/history/memory/vov', element: <MemoryVov /> },
	// { path: '/sport', element: <Sport /> },
	// { path: '/sport/hall-of-fame', element: <HallOfFame /> },
	// { path: '/sport/trainers', element: <Trainers /> },
	// { path: '/sport/student-sport', element: <StudentSport /> },
	// { path: '/gallery', element: <PhotoGallery /> },
	// { path: '/video-gallery', element: <VideoGallery /> },
	// { path: '/studentlife', element: <StudentLife /> },
	// { path: '/studentlife/students-work-teams', element: <StudentsWorkTeams /> },
	// { path: '/studentlife/social-life', element: <SocialLife /> },
	// { path: '/studentlife/student-initiatives', element: <StudentInitiatives /> },
	{ path: '/:section', element: <DynamicSectionMenuPage /> },
	{ path: '*', element: <CmsDynamicPage /> },
];
