import type { ReactElement } from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AdminLogin from '../pages/AdminLogin';
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
	{ path: '/admin/login', element: <AdminLogin /> },
	{
		path: '/admin',
		element: (
			<ProtectedRoute>
				<AdminPanel />
			</ProtectedRoute>
		),
	},
	{ path: '/', element: <Home /> },
	{ path: '/history/rectors', element: <Rectors /> },
	{ path: '/history/rectors/:id', element: <RectorDetails /> },
	{ path: '/history/memory/afgan', element: <MemoryAfgan /> },
	{ path: '/history/memory/vov', element: <MemoryVov /> },
	{ path: '/gallery', element: <PhotoGallery /> },
	{ path: '/video-gallery', element: <VideoGallery /> },
	{ path: '*', element: <PathResolverPage /> },
];
