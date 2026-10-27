export default {
	customSyntax: 'postcss-scss',
	rules: {
		// Element selectors in a CSS module are not hashed, so a bare `a` or `label` restyles the whole app
		'selector-max-type': [
			0,
			{ ignore: ['compounded', 'descendant', 'child'] },
		],
	},
	overrides: [
		{
			// Global element defaults and the form mixins target elements by design
			files: ['src/styles/**/*.scss'],
			rules: { 'selector-max-type': null },
		},
	],
}
