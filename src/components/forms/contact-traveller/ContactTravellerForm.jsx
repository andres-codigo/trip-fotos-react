import PropTypes from 'prop-types'

import { CONTACT_TRAVELLER } from '@/constants/test'
import {
	CONTACT_TRAVELLER_CONFIG,
	CONTACT_TRAVELLER_FIELDS,
} from '@/constants/travellers'

import BaseButton from '@/components/ui/button/BaseButton'
import Textarea from '@/components/ui/form/textarea/Textarea'
import LoadingAnnouncement from '@/components/ui/loading-announcement/LoadingAnnouncement'

import useContactTravellerForm from './hooks/useContactTravellerForm'

const ContactTravellerForm = ({ isLoading = false, onSubmit }) => {
	const { MESSAGE } = CONTACT_TRAVELLER_FIELDS
	const { formData, handleInputChange, handleInputBlur, submitHandler } =
		useContactTravellerForm()

	const getFieldProps = (field) => ({
		id: field,
		value: formData[field].value,
		onChange: handleInputChange,
		onBlur: handleInputBlur,
		isValid: formData[field].isValid,
		message: formData[field].message,
		required: true,
		showRequiredMark: true,
	})

	return (
		<form
			onSubmit={submitHandler(onSubmit)}
			noValidate
			autoComplete="on"
			aria-busy={isLoading}
			data-cy={CONTACT_TRAVELLER.FORM}>
			<LoadingAnnouncement isLoading={isLoading} />
			<div className="my-2 lg:mt-0">
				<Textarea
					{...getFieldProps(MESSAGE)}
					label="Message"
					rows={5}
					className="lg:h-[13.75rem]"
					disabled={isLoading}
					data-cy={CONTACT_TRAVELLER.MESSAGE_INPUT}
					data-cy-error={CONTACT_TRAVELLER.MESSAGE_ERROR}
				/>
			</div>
			<div className="mx-auto text-center">
				<BaseButton
					type="submit"
					isDisabled={isLoading}
					data-cy={CONTACT_TRAVELLER.SUBMIT}>
					{CONTACT_TRAVELLER_CONFIG.SUBMIT_LABEL}
				</BaseButton>
			</div>
		</form>
	)
}

ContactTravellerForm.propTypes = {
	isLoading: PropTypes.bool,
	onSubmit: PropTypes.func.isRequired,
}

export default ContactTravellerForm
