import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingState } from '../design-system/States';
import { useSession } from '../../lib/auth-client';

type Props = {
	children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
	const location = useLocation();
	const { data: session, isPending } = useSession();

	if (isPending) {
		return (
			<div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
				<LoadingState />
			</div>
		);
	}

	if (!session) {
		return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
	}

	return children;
}
