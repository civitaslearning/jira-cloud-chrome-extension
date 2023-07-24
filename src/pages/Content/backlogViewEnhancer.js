import {JIRA_FIELD_IDS} from './jiraApiUtils'
import { enhanceIssueCards, enhanceSelectedIssueCards, applyIssueCardEnhancements } from './jiraViewEnhancer';

/**
 * Returns true if the Jira backlog is displayed
 * 
 * @returns 
 */
export const isBacklogView = () => {
  return !!document.querySelector('[data-test-id="software-backlog.backlog-content.scrollable"]');
}

/**
 * Handles mutations to page that contains the Jira backlog view
 * 
 * @returns 
 */
export const handleBacklogViewMutation = async (mutation) => {
  const BACKLOG_CARDS_SELECTOR = '[data-test-id="software-backlog.backlog-content.scrollable"] *[data-test-id^="software-backlog.card-list.card.content-container"]';
  enhanceSelectedIssueCards(BACKLOG_CARDS_SELECTOR, enhanceBacklogCards);

  handleBacklogIssueEditor(mutation);

  handleInlineBacklogIssueEdits(mutation);
}

/**
 * Enhances backlog cards
 * 
 * @param {*} backlogCards 
 * @returns 
 */
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
 * Applies enhancements to backlog cards
 * 
 * @param {*} backlogCard 
 * @param {*} backlogIssueData 
 */
const applyBacklogCardEnhancements = (backlogCard, backlogIssueData) => {
  applyIssueCardEnhancements(backlogCard, backlogIssueData, enhanceBacklogCard);
}

/**
 * Enhances backlog cards
 * 
 * @param {*} backlogCard 
 * @param {*} backlogIssueData 
 */
const enhanceBacklogCard = (backlogCard, backlogIssueData) => {
  const backlogCardContainer = backlogCard.querySelectorAll(`*[data-testid='software-backlog.card-list.card.card-contents.card-container']`)?.item(0);

  var cardColor;
  if(backlogIssueData.fields["labels"].includes("needs_info")){
    cardColor = "#ffdbff";
  }
  else if(backlogIssueData.fields[JIRA_FIELD_IDS.STORY_POINT_ESTIMATE] || backlogIssueData.fields["labels"].includes("wont_estimate")) {
    cardColor = "#c1e1c1";
  } else if(backlogIssueData.fields["labels"].includes("ready_to_estimate")){
    cardColor = "#daf0f7";
  } else {
    cardColor = "#fafad2";
  }
  colorizeCard(backlogCardContainer, cardColor);
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

/**
 * Handles issue updates from the backlog issue editor
 * 
 * @param {*} mutation 
 * @returns 
 */
const handleBacklogIssueEditor = (mutation) => {
  const element = mutation.target;

  const backlogIssueEditor = element.closest(`[data-testid="software-backlog.detail-view.issue-wrapper.backlog-issue"]`);

  // If the backlog issue editor no-op
  if(!backlogIssueEditor) {
    return;
  }

  // If an <INPUT> element has been removed from the backlog issue editor, this implies that the user has
  // finished editing an attribute of the issue. NOTE: This *doesn't* imply that the user actually made a change, 
  // but for now we just unconditionally update the corrresponding issue card
  const removedNodes = mutation.removedNodes;
  if(removedNodes.length) { 
    removedNodes.forEach(
      node => {
        const inputNode = node.querySelector(`input`);

        // If an <INPUT> element was removed from the backlog issue editor...
        if(inputNode) {
          // Get the key for the issue currently being edited
          const issueKey = backlogIssueEditor.querySelector(`[data-testid="issue.views.issue-base.foundation.breadcrumbs.current-issue.item"]`).textContent;

          console.log(`jce: removed input node ${issueKey}`);

          // Update the corresponding backloh issue card
          enhanceBacklogCards([getBacklogCardFromIssueKey(issueKey)]);
        }
      }
    );
    
  } 
}

/**
 * Returns the backlog card for the specified issue key
 * @param {*} issueKey 
 * @returns 
 */
const getBacklogCardFromIssueKey = (issueKey) => {
  return document.querySelector(getSelectorForBacklogCard(issueKey));
}

/**
 * Gets the Jira backlog card element for the specified issue key
 * 
 * @param {*} issueKey 
 * @returns 
 */

const getSelectorForBacklogCard = (issueKey) => {
  return `[data-test-id="software-backlog.card-list.card.content-container.${issueKey}"]`;
}

/**
 * Handles inline backlog issue edits
 * 
 * @param {*} mutation 
 * @returns 
 */
const handleInlineBacklogIssueEdits = (mutation) => {
  const element = mutation.target;

  const backlogCard = element.closest(`[data-test-id^="software-backlog.card-list.card.content-container."]`);

  // If the mutation was not to backlog card, no-op
  if(!backlogCard) {
    return;
  }

  // If an <INPUT> element has been removed from the backlog backlog card, this implies that the user has
  // finished editing an attribute of the issue. NOTE: This *doesn't* imply that the user actually made a change, 
  // but for now we just unconditionally update the corrresponding issue card
  const removedNodes = mutation.removedNodes;
  if(removedNodes.length) { 
    removedNodes.forEach(
      node => {
        const inputNode = node.querySelector(`input`);
        
        // If an <INPUT> element was removed from the backlog issue editor...
        if(inputNode) {
          
          // Get the key for the issue currently being edited
          const issueKey = getIssueKeyFromBacklogCard(backlogCard);

          // Update the corresponding backloh issue card
          enhanceBacklogCards([getBacklogCardFromIssueKey(issueKey)]);
        }
      }
    );
    
  } 
}




const describeNode = (node) => {
  console.log(`  jce: Node: ${node.nodeName} ${node.nodeType}`);
  if(node.attributes) {
    for (const attr of node.attributes) {
      console.log(`     ${attr.name}=${attr.value}`);
    }
  }
}