import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { TEST_IDS } from '@/constants/test'

import SpinnerIcon from '@/components/ui/spinner/SpinnerIcon'

describe('SpinnerIcon', () => {
	it.each(['md', 'sm'])(
		'is hidden from assistive technology and keeps the props it is given at %s',
		(size) => {
			render(
				<SpinnerIcon
					size={size}
					data-cy={TEST_IDS.SPINNER.ICON}
				/>,
			)

			expect(screen.getByTestId(TEST_IDS.SPINNER.ICON)).toHaveAttribute(
				'aria-hidden',
				'true',
			)
		},
	)
})
