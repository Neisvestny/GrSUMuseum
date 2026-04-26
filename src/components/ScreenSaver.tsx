import { useNavigate } from 'react-router-dom';

type Props = {
	onDismiss: () => void;
};

export default function ScreenSaver({ onDismiss }: Props) {
	const navigate = useNavigate();

	const handleClick = () => {
		onDismiss();
		navigate('/');
	};

	return (
		<div
			onClick={handleClick}
			className="fade-in fixed inset-0 z-50 bg-white flex flex-col items-center justify-center cursor-pointer"
		>
			{/* Пульсирующий логотип / иконка */}
			<div className="relative flex items-center justify-center">
				{/* Внешние кольца анимации */}
				<div className="absolute w-64 h-64 rounded-full bg-blue-100 animate-ping opacity-30" />
				<div
					className="absolute w-48 h-48 rounded-full bg-blue-200 animate-ping opacity-40"
					style={{ animationDelay: '0.5s' }}
				/>

				{/* Основной круг */}
				<div className="relative w-40 h-40 rounded-full bg-blue-700 flex items-center justify-center shadow-lg">
					{/* Иконка университета — книга */}
					<svg
						viewBox="0 0 64 64"
						className="w-20 h-20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						{/* Книга */}
						<path
							d="M8 14C8 14 20 10 32 14V54C32 54 20 50 8 54V14Z"
							fill="white"
							opacity="0.9"
						/>
						<path
							d="M56 14C56 14 44 10 32 14V54C32 54 44 50 56 54V14Z"
							fill="white"
							opacity="0.7"
						/>
						{/* Корешок */}
						<rect
							x="30"
							y="14"
							width="4"
							height="40"
							fill="white"
							opacity="0.5"
							rx="1"
						/>
						{/* Строки текста */}
						<line
							x1="14"
							y1="24"
							x2="28"
							y2="26"
							stroke="#1d4ed8"
							strokeWidth="2"
							strokeLinecap="round"
							opacity="0.6"
						/>
						<line
							x1="14"
							y1="31"
							x2="28"
							y2="33"
							stroke="#1d4ed8"
							strokeWidth="2"
							strokeLinecap="round"
							opacity="0.6"
						/>
						<line
							x1="14"
							y1="38"
							x2="28"
							y2="40"
							stroke="#1d4ed8"
							strokeWidth="2"
							strokeLinecap="round"
							opacity="0.6"
						/>
					</svg>
				</div>
			</div>

			{/* Текст */}
			<div className="mt-12 text-center">
				<p className="text-blue-700 text-2xl font-semibold tracking-wide">
					Гродненский государственный университет
				</p>
				<p className="text-blue-400 text-lg mt-2 tracking-widest uppercase">
					имени Янки Купалы
				</p>
			</div>

			<p className="absolute bottom-12 text-gray-400 text-base tracking-wider animate-pulse">
				Нажмите, чтобы продолжить
			</p>
		</div>
	);
}
