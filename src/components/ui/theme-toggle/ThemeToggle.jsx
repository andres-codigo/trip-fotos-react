import { THEME } from '@/constants/ui'
import { THEME_TOGGLE } from '@/constants/test'

import useThemeMode from './hooks/useThemeMode'

import themeToggleStyles from './ThemeToggle.module.scss'

const iconProps = {
	'aria-hidden': true,
	fill: 'none',
	focusable: 'false',
	height: 18,
	stroke: 'currentColor',
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
	strokeWidth: 2,
	viewBox: '0 0 24 24',
	width: 18,
}

const ICONS = {
	[THEME.MODES.LIGHT]: (
		<svg {...iconProps}>
			<circle
				cx="12"
				cy="12"
				r="4"
			/>
			<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
		</svg>
	),
	[THEME.MODES.DARK]: (
		<svg {...iconProps}>
			<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
		</svg>
	),
	[THEME.MODES.SYSTEM]: (
		<svg {...iconProps}>
			<rect
				x="3"
				y="4"
				width="18"
				height="12"
				rx="2"
			/>
			<path d="M8 20h8M12 16v4" />
		</svg>
	),
}

const ThemeToggle = () => {
	const { mode, setMode } = useThemeMode()

	return (
		<fieldset
			className={themeToggleStyles.toggle}
			data-cy={THEME_TOGGLE.ROOT}>
			<legend className={themeToggleStyles.legend}>
				{THEME.TOGGLE_LABEL}
			</legend>
			{THEME.OPTIONS.map(({ mode: optionMode, label }) => (
				<span
					key={optionMode}
					className={themeToggleStyles.option}>
					<input
						className={themeToggleStyles.input}
						type="radio"
						name="theme-mode"
						id={`theme-mode-${optionMode}`}
						value={optionMode}
						checked={mode === optionMode}
						onChange={() => setMode(optionMode)}
						data-cy={THEME_TOGGLE.OPTION(optionMode)}
					/>
					<label
						className={themeToggleStyles.label}
						htmlFor={`theme-mode-${optionMode}`}>
						{ICONS[optionMode]}
						<span className={themeToggleStyles.text}>{label}</span>
					</label>
				</span>
			))}
		</fieldset>
	)
}

export default ThemeToggle
