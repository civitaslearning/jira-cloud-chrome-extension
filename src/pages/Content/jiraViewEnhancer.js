import {getIssueData} from './jiraApiUtils'


const ENHANCED_BY_EXTENSION_ATTRIBUTE_NAME = 'ENHANCED_BY_EXTENSION';

export const enhanceIssueCards = async (issueCards, getIssueKeyFromCard, issueFields, applyIssueCardModification) => {
  

  issueCards.map(
    issueCard => {
      issueCard.setAttribute(ENHANCED_BY_EXTENSION_ATTRIBUTE_NAME, 'true');
    }
  );
  

  const issueKeys = issueCards.map(
    issueCard => {
      return getIssueKeyFromCard(issueCard);
    }
  );

  const issueDataMap = getIssueDataMap(
      await getIssueData(
        issueKeys,
        issueFields
      )
    );

  issueCards.map(
    issueCard => {
      applyIssueCardModification(issueCard, issueDataMap.get(getIssueKeyFromCard(issueCard)));
    }
  )  
}

/**
 * Gets a map of jira issue data keyed by the issue key
 * 
 * @param {*} issuesData 
 */
const getIssueDataMap = issuesData => {
  const issuesDataMap = new Map();

  issuesData.map(
    issueData => {
      const issueKey = issueData.key;

      issuesDataMap.set(
        issueKey,
        issueData
      );
    }
  );

  return issuesDataMap;
}

export const applyIssueCardEnhancements = (issueCard, issueData, modifyIssueCard) => {
  issueCard.setAttribute(ENHANCED_BY_EXTENSION_ATTRIBUTE_NAME, 'true');
  modifyIssueCard(issueCard, issueData);
}

export const enhanceSelectedIssueCards = (issueCardSelector, issueCardsModifier) => {
  const issueCards = getUnenhancedIssueCards(issueCardSelector);

  issueCardsModifier(issueCards);
}

/**
 * Gets the issue cards that need to be enhanced
 * 
  * @returns 
 */
export const getUnenhancedIssueCards = (cardSelector) => {
  return [...document.querySelectorAll(`${cardSelector}:not([${ENHANCED_BY_EXTENSION_ATTRIBUTE_NAME}])`)];
}