import './BaseSpinner.module.scss'; // Ensure the styles are in a separate SCSS file
import loadingSpinner from '@/assets/loading-spinner.svg';

const BaseSpinner = () => {
	return (
		<div className="spinner">
			<img src={loadingSpinner} alt="Loading..." />
		</div>
	);
};

export default BaseSpinner;
