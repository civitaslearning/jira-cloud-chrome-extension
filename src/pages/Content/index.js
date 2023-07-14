import { enhanceIssueCards, enhanceSelectedIssueCards, applyIssueCardEnhancements } from './jiraViewEnhancer';
import { isBoardView, handleBoardViewMutation } from './boardViewEnhancer';


export const JIRA_VIEW = {
  BACKLOG: "backlog",
  BOARD:"board",
  UNKNOWN:"unknown"
};


import {JIRA_FIELD_IDS} from './jiraApiUtils'


console.log('jce: Content script running 4...')


/**
 * Gets which Jira view is currently displayed. View currently supported are board and backlog.
 * 
 * @returns 
 */
const getJiraView = () => {
  if (isBacklogView()) {
    return JIRA_VIEW.BACKLOG;
  }

  if (isBoardView()) {
    return JIRA_VIEW.BOARD;
  }

  return JIRA_VIEW.UNKNOWN;
}

/**
 * Returns true if the Jira backlog is displayed
 * 
 * @returns 
 */
const isBacklogView = () => {
  return !!document.querySelector('[data-test-id="software-backlog.backlog-content.scrollable"]');
}




/**
 * Sets the background color of the specified issue card element
 * 
 * @param {*} issueCard 
 * @param {*} color 
 */
const colorizeCard = (issueCard, color) => {
  issueCard?.setAttribute("style", `background-color:${color}`);  
}


const enhanceBacklogCard = (backlogCard, backlogIssueData) => {
  const backlogCardContainer = backlogCard.querySelectorAll(`*[data-testid='software-backlog.card-list.card.card-contents.card-container']`)?.item(0);

  var cardColor;
  if(backlogIssueData.fields[JIRA_FIELD_IDS.STORY_POINT_ESTIMATE]) {
    cardColor = "#c1e1c1";
  } else {
    cardColor = "#fafad2";
  }
  colorizeCard(backlogCardContainer, cardColor);
}

const applyBacklogCardEnhancements = (backlogCard, backlogIssueData) => {
  applyIssueCardEnhancements(backlogCard, backlogIssueData, enhanceBacklogCard);
}


const enhanceBacklogCards = async (backlogCards) => {
  return enhanceIssueCards( 
    backlogCards,
    getIssueKeyFromBacklogCard,
    [
      JIRA_FIELD_IDS.ASSIGNEE,
      JIRA_FIELD_IDS.ISSUE_TYPE,
      JIRA_FIELD_IDS.KEY,
      JIRA_FIELD_IDS.LABELS,
      JIRA_FIELD_IDS.OWNER,
      JIRA_FIELD_IDS.PAIR_ASSIGNEE, 
      JIRA_FIELD_IDS.STATUS, 
      JIRA_FIELD_IDS.STORY_POINT_ESTIMATE,
      JIRA_FIELD_IDS.TESTER
    ],
    applyBacklogCardEnhancements
  );
}


const enhanceBacklog = async () => {
  const BACKLOG_CARDS_SELECTOR = '[data-test-id="software-backlog.backlog-content.scrollable"] *[data-test-id^="software-backlog.card-list.card.content-container"]';
  return enhanceSelectedIssueCards(BACKLOG_CARDS_SELECTOR, enhanceBacklogCards);
}



/**
 * Gets the Jira issue key from the given backlog card
 * 
 * @param {*} backlogCard 
 * @returns 
 */
const getIssueKeyFromBacklogCard = backlogCard => {
  console.log(`jce: getIssueKeyFromBacklogCard`);
  return backlogCard?.getAttribute("data-test-id").slice('software-backlog.card-list.card.content-container.'.length);
}


/**
 * Observe mutations and update the backlog as necessary
 */
const observer = new MutationObserver(
  mutations => {  
    mutations.map(
      mutation => {

        switch(getJiraView()) {
          case JIRA_VIEW.BACKLOG:
            enhanceBacklog(mutation);  
            break;
          case JIRA_VIEW.BOARD:
            handleBoardViewMutation(mutation);  
            break;
        }
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