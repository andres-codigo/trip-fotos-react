// Project v2 helpers shared by the Issue Intake and Project Item Lifecycle workflows.
// The IDs belong to the `Trip Fotos React` project; see docs/ci-cd.md for how to look them up.
export const PROJECT_ID = 'PVT_kwHOAybMeM4BCojE'
export const STATUS_FIELD_ID = 'PVTSSF_lAHOAybMeM4BCojEzg0yW4g'
export const STATUS = {
	TRIAGE: '46daf40e',
	BACKLOG: '7be623db',
	READY: 'f75ad846',
	IN_PROGRESS: '47fc9ee4',
	BLOCKED: 'ba1ca20d',
	IN_REVIEW: '5e639cc6',
	DONE: '98236657',
}

export const isResourceAccessError = (error) =>
	String(error?.message || '').includes(
		'Resource not accessible by integration',
	)

// `graphql` is an Octokit-style `(query, variables) => data` function, so the PAT client can be swapped in
export const createProjectClient = (graphql) => {
	const findItemId = async (contentId) => {
		const data = await graphql(
			`
				query ($contentId: ID!) {
					node(id: $contentId) {
						... on Issue {
							projectItems(first: 20) {
								nodes {
									id
									project {
										id
									}
								}
							}
						}
						... on PullRequest {
							projectItems(first: 20) {
								nodes {
									id
									project {
										id
									}
								}
							}
						}
					}
				}
			`,
			{ contentId },
		)
		const items = data?.node?.projectItems?.nodes || []
		return (
			items.find((item) => item?.project?.id === PROJECT_ID)?.id || null
		)
	}

	const addItem = async (contentId) => {
		const data = await graphql(
			`
				mutation ($projectId: ID!, $contentId: ID!) {
					addProjectV2ItemById(
						input: { projectId: $projectId, contentId: $contentId }
					) {
						item {
							id
						}
					}
				}
			`,
			{ projectId: PROJECT_ID, contentId },
		)
		return data?.addProjectV2ItemById?.item?.id || null
	}

	const ensureItem = async (contentId) =>
		(await findItemId(contentId)) || addItem(contentId)

	// A missing card (no itemId) is skipped; a missing option ID is a bug and throws
	const setStatus = async (itemId, optionId) => {
		if (!itemId) return
		if (!optionId) throw new Error('setStatus needs a status option ID')

		await graphql(
			`
				mutation (
					$projectId: ID!
					$itemId: ID!
					$fieldId: ID!
					$optionId: String!
				) {
					updateProjectV2ItemFieldValue(
						input: {
							projectId: $projectId
							itemId: $itemId
							fieldId: $fieldId
							value: { singleSelectOptionId: $optionId }
						}
					) {
						projectV2Item {
							id
						}
					}
				}
			`,
			{
				projectId: PROJECT_ID,
				itemId,
				fieldId: STATUS_FIELD_ID,
				optionId,
			},
		)
	}

	return { findItemId, addItem, ensureItem, setStatus }
}
