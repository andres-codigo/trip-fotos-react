export default {
	customSyntax: 'postcss-scss',
	rules: {
		// Element selectors in a CSS module are not hashed, so a bare `a` or `label` restyles the whole app
		'selector-max-type': [
			0,
			{ ignore: ['compounded', 'descendant', 'child'] },
		],
	},
}
