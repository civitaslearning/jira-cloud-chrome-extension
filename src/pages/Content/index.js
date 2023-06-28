import {getIssueData, JIRA_FIELD_IDS} from './jiraApiUtils'

const MODIFIED_BY_EXTENSION_ATTRIBUTE_NAME = 'modified_by_extension';
const BACKLOG_CARDS_SELECTOR = '[data-test-id="software-backlog.backlog-content.scrollable"] *[data-test-id^="software-backlog.card-list.card.content-container"]';

console.log('jce: Content script running...')

const colorizeCard = (issueCardEl, color) => {
  const issueCardContainerEl = issueCardEl.querySelectorAll(`*[data-testid='software-backlog.card-list.card.card-contents.card-container']`)?.item(0);
  
  issueCardContainerEl?.setAttribute("style", `background-color:${color}`);
  
}

/**
 * Gets the element that contains the board
 * 
 * @returns 
 */
const getBoardElement = () => {
  return document.querySelectorAll(`*[data-test-id='software-board.board']`)?.item(0);
}

/**
 * Gets the issue cards that need to be modified
 * 
  * @returns 
 */
const getIssueCardsThatNeedModification = (cardSelector) => {
  return [...document.querySelectorAll(`${cardSelector}:not([${MODIFIED_BY_EXTENSION_ATTRIBUTE_NAME}])`)];
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

const modifyBacklogCards = async () => {
  return modifyIssueCards( 
    BACKLOG_CARDS_SELECTOR, 
    getIssueKeyFromBacklogCard,
    [
      JIRA_FIELD_IDS.ASSIGNEE,
      JIRA_FIELD_IDS.KEY,
      JIRA_FIELD_IDS.LABELS,
      JIRA_FIELD_IDS.OWNER,
      JIRA_FIELD_IDS.PAIR_ASSIGNEE, 
      JIRA_FIELD_IDS.STORY_POINT_ESTIMATE,
      JIRA_FIELD_IDS.TESTER
    ],
    applyBacklogCardModifications
  );
}

const modifyIssueCards = async (issueCardSelector, getIssueKeyFromCard, issueFields, applyIssueCardModification) => {
  const issueCards = getIssueCardsThatNeedModification(issueCardSelector);

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
 * 
 * @param {*} issueCardElement 
 * @param {*} issueData 
 */
const applyBacklogCardModifications = (issueCardElement, issueData) => {  
  if(issueData.fields[JIRA_FIELD_IDS.STORY_POINT_ESTIMATE]) {
    colorizeCard(issueCardElement, "#c1e1c1");
  } else {
    colorizeCard(issueCardElement, "#fafad2");
  }
}

/**
 * Gets the Jira issue key from the given backlog card
 * 
 * @param {*} backlogCard 
 * @returns 
 */
const getIssueKeyFromBacklogCard = backlogCard => {
  
  return backlogCard?.getAttribute("data-test-id").slice('software-backlog.card-list.card.content-container.'.length);
}

/**
 * Indicate the element has already been modified by the extension
 * 
 * @param {
 * } element 
 */
const setModifiedByExtension = (element) => {
  element.setAttribute('modified-by-extension', 'true');
}

/**
 * Observe mutations and update the backlog as necessary
 */
const observer = new MutationObserver(
  mutations => {  
    mutations.map(
      mutation => {
        modifyBacklogCards();
      }       
    )
  }    
);


const target = document.querySelector("html");
const config = { childList:true, subtree:true};

/**
 * Observe all mutations to the DOM
 * TODO: Optimize this later if necessary
 */

observer.observe(target, config);