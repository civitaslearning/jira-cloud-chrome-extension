import {getIssueData, JIRA_FIELD_IDS} from './jiraApiUtils'

console.log('jce: Content script running...')

const colorizeCard = (issueCardEl, color) => {
  const issueCardContainerEl = issueCardEl.querySelectorAll(`*[data-testid='software-backlog.card-list.card.card-contents.card-container']`)?.item(0);
  
  issueCardContainerEl?.setAttribute("style", `background-color:${color}`);
  
}


/**
 * Gets the element that contains the backlog
 * 
 * @returns 
 */
const getBacklogElement = () => {
  return document.querySelectorAll(`*[data-test-id='software-backlog.backlog-content.scrollable']`)?.item(0);
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
 * Gets the backlog cards that are descendents of the backlog element
 * 
 * @param {*} backlogElement 
 * @returns 
 */
const getBacklogCards = backlogElement => {
  return backlogElement.querySelectorAll(`*[data-test-id^='software-backlog.card-list.card.content-container']`);
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

/**
 * Handles a mutation of the backlogElement
 * 
 * @param {*} backlogElement 
 * @returns 
 */
const handleBacklogMutation = async backlogElement => {
  const backlogCards = getBacklogCards(backlogElement);

  const backlogCardsThatNeedModificationMap = 
    getMapOfCardsThatNeedModification(
      backlogCards,
      getIssueKeyFromBacklogCard
      );
  
  const issueData = await getIssueData(
    [...backlogCardsThatNeedModificationMap.keys()], // Convert map iterator to Array
    [
      JIRA_FIELD_IDS.ASSIGNEE,
      JIRA_FIELD_IDS.KEY,
      JIRA_FIELD_IDS.LABELS,
      JIRA_FIELD_IDS.OWNER,
      JIRA_FIELD_IDS.PAIR_ASSIGNEE, 
      JIRA_FIELD_IDS.STORY_POINT_ESTIMATE,
      JIRA_FIELD_IDS.TESTER
    ]
  );

  const issueDataMap = getIssueDataMap(issueData);

  backlogCardsThatNeedModificationMap.forEach(
    (issueCard, issueKey) => {
      applyBacklogCardModifications(issueCard, issueDataMap.get(issueKey));
    }
  );
}

/**
 * Handles a mutation of the boardElement
 * 
 * @param {*} boardElement 
 * @returns 
 */
const handleBoardMutation = async boardElement => {

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
 * Gets a map of all issue cards that need modification. Map is keyed by the issue key.
 * 
 * @param {*} issueCards 
 */
const getMapOfCardsThatNeedModification = (
  issueCards,
  getIssueKeyFromCard
 ) => {
  const issueCardsThatNeedModificationMap = new Map();

  issueCards?.forEach(
    issueCard => {
      if( !isModifiedByExtension(issueCard)) {
        setModifiedByExtension(issueCard);
        issueCardsThatNeedModificationMap.set(
          getIssueKeyFromCard(issueCard),
          issueCard
        );
      }
    }
  );

  if(issueCardsThatNeedModificationMap.size) {
    console.log(`jce: getMapOfCardsThatNeedModification: found ${issueCardsThatNeedModificationMap.size} issue card elements that need modification`);
  }
  return issueCardsThatNeedModificationMap;
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
 * Has the element already been modified by this extension
 * 
 * @param {*} element 
 * @returns 
 */
const isModifiedByExtension = (element) => {
  return element?.getAttribute('modified-by-extension')
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
        const mutationTarget = mutation.target;

        const backlogElement = getBacklogElement(mutationTarget);
        
        if(backlogElement) {
          handleBacklogMutation(backlogElement);
        }
        else {
          const boardElement = getBoardElement(mutationTarget);
          handleBoardMutation(boardElement);
        }

        /*const backlogNode = getBacklogElement(mutation.target);

        if(backlogNode) {
          console.log('jce: Found backlog');
          handleBacklogMutation(backlogNode);
        }*/
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