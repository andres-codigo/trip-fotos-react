import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { VERIFIED_CHIP_CONFIG } from '@/constants/auth'

import VerifiedChip from '@/components/ui/verified-chip/VerifiedChip'

describe('<VerifiedChip />', () => {
	it('says Verified when the email is verified', () => {
		render(<VerifiedChip verified />)
		expect(
			screen.getByText(VERIFIED_CHIP_CONFIG.VERIFIED),
		).toBeInTheDocument()
	})

	it('says Not verified when the email is not verified', () => {
		render(<VerifiedChip verified={false} />)
		expect(
			screen.getByText(VERIFIED_CHIP_CONFIG.NOT_VERIFIED),
		).toBeInTheDocument()
	})
})
