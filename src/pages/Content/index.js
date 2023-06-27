import {getIssueDataForIssueKeys, JIRA_FIELD_IDS} from './jiraApiUtils'

console.log('jce: Content script running...')

const colorizeCard = (issueCardEl, color) => {
  console.log('jce: colorizeCard');
  const issueCardContainerEl = issueCardEl.querySelectorAll(`*[data-testid='software-backlog.card-list.card.card-contents.card-container']`)?.item(0);
  
  issueCardContainerEl?.setAttribute("style", `background-color:${color}`);
  
}


/**
 * Gets the element that contains the backlog
 * 
 * @param {*} element 
 * @returns 
 */
const getBacklogElement = element => {
  return element.querySelectorAll(`*[data-test-id='software-backlog.backlog-content.scrollable']`)?.item(0);
}

/**
 * Gets the descendent issue card elements of the backlog element
 * 
 * @param {*} backlogElement 
 * @returns 
 */
const getIssueCardElements = backlogElement => {
  return backlogElement.querySelectorAll(`*[data-test-id^='software-backlog.card-list.card.content-container']`);
}

/**
 * Gets a map of jira issue data keyed by the issue key
 * 
 * @param {*} issuesData 
 */
const getIssuesDataMap = issuesData => {
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
  const issueCardElements = getIssueCardElements(backlogElement);

  const issueCardElementsThatNeedModificationMap = getMapOfIssueCardElementsThatNeedModification(issueCardElements);
  
  const issuesData = await getIssueDataForIssueKeys(
    [...issueCardElementsThatNeedModificationMap.keys()], // Convert map iterator to Array
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

  const issuesDataMap = getIssuesDataMap(issuesData);

  issueCardElementsThatNeedModificationMap.forEach(
    (issueCardElement, issueKey) => {
      applyBaseCardModifications(issueCardElement, issuesDataMap.get(issueKey));
    }
  );
}

/**
 * 
 * @param {*} issueCardElement 
 * @param {*} issueData 
 */
const applyBaseCardModifications = (issueCardElement, issueData) => {
  console.log(`jce: applyBaseCardModifications: ${issueData.fields[JIRA_FIELD_IDS.STORY_POINT_ESTIMATE]}`);
  
  if(issueData.fields[JIRA_FIELD_IDS.STORY_POINT_ESTIMATE]) {
    colorizeCard(issueCardElement, "#c1e1c1");
  } else {
    colorizeCard(issueCardElement, "#fafad2");
  }
}

/**
 * Gets a map of all issue card elements that need modification. Map is keyed by the issue key.
 * 
 * @param {*} issueCardElements 
 */
const getMapOfIssueCardElementsThatNeedModification = issueCardElements => {
  console.log(`jce: getMapOfIssueCardElementsThatNeedModification: processing ${issueCardElements.length} issue card elements`);
  const issueCardElementsThatNeedModificationMap = new Map();

  issueCardElements?.forEach(
    issueCardElement => {
      if( !isModifiedByExtension(issueCardElement)) {
        setModifiedByExtension(issueCardElement);
        issueCardElementsThatNeedModificationMap.set(
          getIssueKeyFromIssueCardElement(issueCardElement),
          issueCardElement
        );
      }
    }
  );

  console.log(`jce: getMapOfIssueCardElementsThatNeedModification: found ${issueCardElementsThatNeedModificationMap.size} issue card elements that need modification`);
  return issueCardElementsThatNeedModificationMap;
}

/**
 * Gets the Jira issue key from the given issue card element
 * 
 * @param {*} issueCardElement 
 * @returns 
 */
const getIssueKeyFromIssueCardElement = issueCardElement => {
  
  return issueCardElement?.getAttribute("data-test-id").slice('software-backlog.card-list.card.content-container.'.length);
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
        handleBacklogMutation(mutation.target);

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