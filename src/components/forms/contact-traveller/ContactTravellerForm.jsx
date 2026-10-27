import PropTypes from 'prop-types'
import classNames from 'classnames'

import { CONTACT_TRAVELLER } from '@/constants/test'
import {
	CONTACT_TRAVELLER_CONFIG,
	CONTACT_TRAVELLER_FIELDS,
} from '@/constants/travellers'
import { ACCESSIBILITY } from '@/constants/ui'

import BaseButton from '@/components/ui/button/BaseButton'
import Input from '@/components/ui/form/input/Input'
import Textarea from '@/components/ui/form/textarea/Textarea'

import useContactTravellerForm from './hooks/useContactTravellerForm'

import contactTravellerFormStyles from './ContactTravellerForm.module.scss'

const ContactTravellerForm = ({
	userEmail = '',
	isLoading = false,
	onSubmit,
}) => {
	const { EMAIL, MESSAGE } = CONTACT_TRAVELLER_FIELDS
	const { formData, handleInputChange, submitHandler } =
		useContactTravellerForm(userEmail)

	const getFieldProps = (field) => ({
		id: field,
		value: formData[field].value,
		onChange: handleInputChange,
		onBlur: handleInputChange,
		isValid: formData[field].isValid,
		message: formData[field].message,
		required: true,
		showRequiredMark: true,
	})

	const getControlClassName = (field) =>
		classNames(contactTravellerFormStyles.formControl, {
			[contactTravellerFormStyles.invalidForm]: !formData[field].isValid,
		})

	return (
		<form
			className={contactTravellerFormStyles.contactTraveller}
			onSubmit={submitHandler(onSubmit)}
			noValidate
			autoComplete="on"
			aria-busy={isLoading}
			data-cy={CONTACT_TRAVELLER.FORM}>
			<div
				aria-live="polite"
				style={ACCESSIBILITY.ARIA_LIVE.POLITE.STYLE}>
				{isLoading ? ACCESSIBILITY.ARIA_LIVE.POLITE.MESSAGE : ''}
			</div>
			<div className={getControlClassName(EMAIL)}>
				<Input
					{...getFieldProps(EMAIL)}
					label="E-Mail"
					type="email"
					autoComplete="email"
					// The signed-in user's email identifies the sender, so it is not editable
					disabled={isLoading || Boolean(userEmail)}
					data-cy={CONTACT_TRAVELLER.EMAIL_INPUT}
					data-cy-error={CONTACT_TRAVELLER.EMAIL_ERROR}
				/>
			</div>
			<div className={getControlClassName(MESSAGE)}>
				<Textarea
					{...getFieldProps(MESSAGE)}
					label="Message"
					rows={5}
					disabled={isLoading}
					data-cy={CONTACT_TRAVELLER.MESSAGE_INPUT}
					data-cy-error={CONTACT_TRAVELLER.MESSAGE_ERROR}
				/>
			</div>
			<div className={contactTravellerFormStyles.formActions}>
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
	userEmail: PropTypes.string,
	isLoading: PropTypes.bool,
	onSubmit: PropTypes.func.isRequired,
}

export default ContactTravellerForm
