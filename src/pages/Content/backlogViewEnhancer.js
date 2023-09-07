import React from 'react';
import { createRoot } from 'react-dom/client';
import {JIRA_FIELD_IDS, JIRA_STATUSES, getLabels} from './jiraApiUtils'
import { enhanceIssueCards, enhanceSelectedIssueCards, applyIssueCardEnhancements } from './jiraViewEnhancer';
import { addQuickFilters, handleQuickFiltersMutation} from './filtersEnhancer';
import AlertsIndicator from './AlertsIndicator';


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
  addQuickFilters(document.querySelector('[data-test-id="software-filters.ui.list-filter-container"]').parentElement.parentElement.parentElement.parentElement);

  const BACKLOG_CARDS_SELECTOR = '[data-test-id="software-backlog.backlog-content.scrollable"] *[data-test-id^="software-backlog.card-list.card.content-container"]';
  enhanceSelectedIssueCards(BACKLOG_CARDS_SELECTOR, enhanceBacklogCards);

  handleBacklogIssueEditor(mutation);

  handleInlineBacklogIssueEdits(mutation);

  handleQuickFiltersMutation(mutation);
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
      JIRA_FIELD_IDS.FLAGGED,
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
  // Reset style
  backlogCard.setAttribute("style","");

  const backlogCardContainer = backlogCard.querySelectorAll(`*[data-testid='software-backlog.card-list.card.card-contents.card-container']`)?.item(0);

  var cardColor;
  if(backlogIssueData.fields["labels"].includes("needs_info")){
    cardColor = "#ffdbff";
  }
  else if( isReadyToWork(backlogIssueData) ){
    cardColor = "#c1e1c1";
  } else if( isReadyToEstimate(backlogIssueData) ){
    cardColor = "#daf0f7";
  } else if ( isCutLine(backlogIssueData) ){
    cardColor = "#ffc09f";
  } else {
    cardColor = "#fafad2";
  }

  colorizeCard(backlogCardContainer, cardColor);

  const alerts = getBacklogIssueAlerts(backlogIssueData);
  updateBacklogCardAlertsIndicator(backlogCardContainer, alerts);  
}

const isReadyToWork = (backlogIssueData) => {
  return backlogIssueData.fields[JIRA_FIELD_IDS.STORY_POINT_ESTIMATE] || backlogIssueData.fields["labels"].includes("wont_estimate");
}

const isReadyToEstimate = (backlogIssueData) => {
  return backlogIssueData.fields["labels"].includes("ready_to_estimate");
}

const isCutLine = (backlogIssueData) => {
  return backlogIssueData.fields["labels"].includes("cut_line");
}

const hasFocusGroup = (backlogIssueData) => {
  const FOCUS_GROUP_LABELS = ["application_focus_group", "cda_data_cost_focus_group", "model_focus_group"];

    return getLabels(backlogIssueData).some(issueLabel => FOCUS_GROUP_LABELS.includes(issueLabel));
}

const getAssigneeName = (backlogIssueData) => {
  return backlogIssueData.fields[JIRA_FIELD_IDS.ASSIGNEE]?.displayName;
}

const getOwnerName = (backlogIssueData) => {
  return backlogIssueData.fields[JIRA_FIELD_IDS.OWNER]?.[0]?.displayName 
}

const getStatusId = (backlogIssueData) => {
  return backlogIssueData.fields[JIRA_FIELD_IDS.STATUS].id;
}

/**
 * Get any alerts based on the specified issue data
 * 
 * @param {*} backlogIssueData 
 * @returns an array of alert message strings
 */
const getBacklogIssueAlerts = (backlogIssueData) => {
  const backlogIssueAlerts = [];

  
  if( !isReadyToWork(backlogIssueData) && !isReadyToEstimate(backlogIssueData) ) {

    if( !hasFocusGroup(backlogIssueData) ) {
      backlogIssueAlerts.push(`No Focus Group`);
    }
  }

  const ownerName = getOwnerName(backlogIssueData);
  const assigneeName = getAssigneeName(backlogIssueData);

  if( ownerName != assigneeName && getStatusId(backlogIssueData) === JIRA_STATUSES.TO_DO){
    backlogIssueAlerts.push(`Owner (${ownerName?ownerName:"None"}) != Assignee (${assigneeName?assigneeName:"None"})`);
  }

  /*
  if(issueData.fields[JIRA_FIELD_IDS.OWNER].l) {
    if(issueData.fields[JIRA_FIELD_IDS.OWNER][0]?.displayName != issueData.fields[JIRA_FIELD_IDS.ASSIGNEE]?.displayName ) {
    backlogIssueAlerts.push(`Owner: ${issueData.fields[JIRA_FIELD_IDS.OWNER]?.displayName } != Assignee: ${issueData.fields[JIRA_FIELD_IDS.ASSIGNEE]?.displayName}`);
  } else if (issueData.fields[JIRA_FIELD_IDS.ASSIGNEE]) {
    backlogIssueAlerts.push(`Owner: != Assignee`);
  }
  */

  
  return backlogIssueAlerts;
}

const updateBacklogCardAlertsIndicator = (backlogCard, alerts) => {
  const ALERTS_INDICATOR_WRAPPER_ID = "ALERTS_INDICATOR_WRAPPER_ID";
  
  var alertsIndicatorWrapper = backlogCard.querySelector(`[id="${ALERTS_INDICATOR_WRAPPER_ID}"`);

  // Remove the alerts indicator, if any
  if(alertsIndicatorWrapper) {
    alertsIndicatorWrapper.remove();
  }
   
  // Add the alerts indicator if there are alerts
  if(alerts.length) {
    const alertIndicatorInsertionPoint = backlogCard.children.item(5);

    const alertsIndicatorWrapper = document.createElement("div");
    alertsIndicatorWrapper.setAttribute("style", "position:relative;");
    alertsIndicatorWrapper.setAttribute("id", ALERTS_INDICATOR_WRAPPER_ID);

    alertIndicatorInsertionPoint.insertAdjacentElement(`beforebegin`, alertsIndicatorWrapper);
    const alertsIndicatorRoot = createRoot(alertsIndicatorWrapper);
    alertsIndicatorRoot.render(<AlertsIndicator alerts={alerts} />);
  }
}

/**
 * Sets the background color of the specified backlog card element
 * 
 * @param {*} backlogCardContainer 
 * @param {*} color 
 */
const colorizeCard = (backlogCardContainer, color) => {
  appendStyle(backlogCardContainer, `background-color:${color};`)
}

const appendStyle = (element, style) => {
  const previousStyle = element?.getAttribute("style");
  element?.setAttribute("style", `${previousStyle?previousStyle:""}${style};`);  
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