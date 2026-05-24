import type { ReactElement } from 'react';
import AdminPanel from '../pages/AdminPanel';
import MemoryAfgan from '../pages/history/MemoryAfgan';
import MemoryVov from '../pages/history/MemoryVov';
import Rectors from '../pages/history/Rectors';
import Home from '../pages/Home';
import PathResolverPage from '../pages/PathResolverPage';
import PhotoGallery from '../pages/PhotoGallery';
import RectorDetails from '../pages/RectorDetails';
import VideoGallery from '../pages/VideoGallery';

export type AppRoute = {
	path: string;
	element: ReactElement;
};

export const appRoutes: AppRoute[] = [
	{ path: '/admin', element: <AdminPanel /> },
	{ path: '/', element: <Home /> },
	// { path: '/history', element: <History /> },
	// { path: '/history/development', element: <TeachersInstitute /> },
	{ path: '/history/rectors', element: <Rectors /> },
	{ path: '/history/rectors/:id', element: <RectorDetails /> },
	// { path: '/history/memory', element: <Memory /> },
	{ path: '/history/memory/afgan', element: <MemoryAfgan /> },
	{ path: '/history/memory/vov', element: <MemoryVov /> },
	// { path: '/sport', element: <Sport /> },
	// { path: '/sport/hall-of-fame', element: <HallOfFame /> },
	// { path: '/sport/trainers', element: <Trainers /> },
	// { path: '/sport/student-sport', element: <StudentSport /> },
	{ path: '/gallery', element: <PhotoGallery /> },
	{ path: '/video-gallery', element: <VideoGallery /> },
	// { path: '/studentlife', element: <StudentLife /> },
	// { path: '/studentlife/students-work-teams', element: <StudentsWorkTeams /> },
	// { path: '/studentlife/social-life', element: <SocialLife /> },
	// { path: '/studentlife/student-initiatives', element: <StudentInitiatives /> },
	{ path: '*', element: <PathResolverPage /> },
];
