import type { ComponentProps } from 'react';
import Button from '../../../design-system/Button';

type Props = ComponentProps<typeof Button>;

export default function AdminButton({ className = '', ...rest }: Props) {
	return <Button {...rest} className={`shadow-sm hover:shadow-md ${className}`} />;
}
