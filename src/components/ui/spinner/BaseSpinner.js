import baseSpinnerStyles from './BaseSpinner.module.scss';
import loadingSpinner from '@/assets/loading-spinner.svg';

const BaseSpinner = () => {
	return (
		<div className={baseSpinnerStyles.spinner}>
			<img src={loadingSpinner} alt="Loading..." />
		</div>
	);
};

export default BaseSpinner;
