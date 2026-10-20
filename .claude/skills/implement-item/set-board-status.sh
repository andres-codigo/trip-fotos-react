#!/usr/bin/env bash
# Usage: set-board-status.sh <issue-number> [status]   (status: backlog | todo | in-progress | done; default in-progress)
# Moves an issue on project 2. IDs mirror .github/workflows/project-item-lifecycle.yml
set -euo pipefail

ISSUE="$1"
STATUS="${2:-in-progress}"
PROJECT_ID='PVT_kwHOAybMeM4BCojE'
FIELD_ID='PVTSSF_lAHOAybMeM4BCojEzg0yW4g'

case "$STATUS" in
	backlog) OPTION_ID='7be623db' ;;
	todo) OPTION_ID='f75ad846' ;;
	in-progress) OPTION_ID='47fc9ee4' ;;
	done) OPTION_ID='98236657' ;;
	*) echo "Unknown status: $STATUS" >&2; exit 1 ;;
esac

ITEM_ID=$(gh api graphql -f query='query($n:Int!){repository(owner:"andres-codigo",name:"trip-fotos-react"){issue(number:$n){projectItems(first:10){nodes{id project{id}}}}}}' \
	-F n="$ISSUE" -q ".data.repository.issue.projectItems.nodes[] | select(.project.id==\"$PROJECT_ID\") | .id")

if [ -z "$ITEM_ID" ]; then
	echo "#$ISSUE is not on project 2" >&2
	exit 1
fi

gh api graphql -f query='mutation($p:ID!,$i:ID!,$f:ID!,$o:String!){updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,value:{singleSelectOptionId:$o}}){projectV2Item{id}}}' \
	-f p="$PROJECT_ID" -f i="$ITEM_ID" -f f="$FIELD_ID" -f o="$OPTION_ID" >/dev/null

echo "#$ISSUE → $STATUS"
