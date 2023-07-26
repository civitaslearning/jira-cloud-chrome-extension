import React from 'react';
import AlertsIndicator from './AlertsIndicator';
import UserAvatar from './UserAvatar';
import { createRoot } from 'react-dom/client';
import {JIRA_FIELD_IDS, JIRA_LABELS, getLabels, isBug, isDone, isReadyForQA} from './jiraApiUtils'
import { enhanceIssueCards, enhanceSelectedIssueCards, applyIssueCardEnhancements } from './jiraViewEnhancer';

const BOARD_CARDS_SELECTOR = '*[data-test-id="software-board.board"] *[data-testid="platform-board-kit.ui.card.card"]';

const ALERTS_INDICATOR_WRAPPER_ID = 'ALERTS_INDICATOR_WRAPPER_ID';
const QUICK_FILTERS_WRAPPER_ID = 'QUICK_FILTERS_WRAPPER_ID';

/**
 * Returns true if the Jira board is diplayed 
 * 
 * @returns 
 */
export const isBoardView = () => {
  return !!document.querySelector('[data-test-id="software-board.board"]');
}

const enhanceBoard = () => {
  
  if( getQuickFiltersWrapper() ) {
    return;
  }

  applyStyleRules(quickFilterButtonStyleRules);

  const quickFiltersSibling = document.querySelector('[data-test-id="software-board.header.controls-bar"]').parentElement.parentElement;

  const quickFilterWrapper = document.createElement("div");
  quickFilterWrapper.setAttribute("id", QUICK_FILTERS_WRAPPER_ID);  
  quickFilterWrapper.setAttribute("class", `quick-filter-wrapper`);  

  const quickFiltersContainer = document.createElement("dl");
  quickFiltersContainer.setAttribute("class", `quick-filters-container`);  

  const quickFiltersTitle = document.createElement("dt");
  quickFiltersTitle.setAttribute("class", `quick-filter-title`);  
  quickFiltersTitle.textContent = "Quick Filters:"
  quickFiltersContainer.appendChild(quickFiltersTitle);

  appendQuickFilterLabel(quickFiltersContainer, "OWNER:");
  appendQuickFilterButton(quickFiltersContainer, "Test NO-OP");
  
  quickFilterWrapper.appendChild(quickFiltersContainer);

  quickFiltersSibling.insertAdjacentElement(`beforebegin`, quickFilterWrapper);
}

const appendQuickFilterLabel = (quickFiltersContainer, displayName) => {
  const quickFilterLabel = document.createElement("dd");
  quickFilterLabel.setAttribute("class", `quick-filter-label`);
  quickFilterLabel.textContent = displayName;

  quickFiltersContainer.appendChild(quickFilterLabel);
}

const appendQuickFilterButton = (quickFiltersContainer, displayName) => {
  const quickFilterButtonContainer = document.createElement("dd");
  quickFilterButtonContainer.setAttribute("class", `quick-filter-button-container`);  

  const quickFilterButton = document.createElement("a");
  quickFilterButton.setAttribute("class", `quick-filter-button`);  
  quickFilterButton.textContent = displayName;

  quickFilterButton.addEventListener("click", buttonPressed);
  quickFilterButtonContainer.appendChild(quickFilterButton);

  quickFiltersContainer.appendChild(quickFilterButtonContainer);
}

const buttonPressed = (e) => {
  e.target.classList.toggle("quick-filter-button-active");
  
  // e.target.innerText = e.target.innerText.trim() === "OFF"?"ON":"OFF";
}

const getQuickFiltersWrapper = () => {
  return document.querySelector(`[id="${QUICK_FILTERS_WRAPPER_ID}"]`);
}

const quickFilterButtonStyleRules =`
.quick-wrapper{
  display: inline-block;
  margin: 0px;
}

.quick-filters-container{
  display: inline-block;
  padding: 10px 0px 0px 0px;
  margin: 0px;
}

.quick-filter-title{
  display: inline-block;
  font-weight: bold;
  padding-right: 5px;
}

.quick-filter-label{
  display: inline-block; 
  margin: 0px 4px 0px 6px
}

.quick-filter-button-container{
  display: inline-block;
  padding: 0px;
  margin: 0px 4px 8px 4px;
  text-decoration: none;
}

.quick-filter-button{
  border: 1px solid transparent;
  display: inline-block;
  padding: 6px 9px;
  /*padding: 7px 10px;*/
  
  text-decoration: none;
}
.quick-filter-button:hover{
  border: 1px solid lightgray;
  border-radius: 15px 15px 15px 15px;
  display: inline-block;
  /*padding: 7px 10px;*/
  padding: 6px 9x;
  
  text-decoration: none;
}
.quick-filter-button-active{
  color: #3b73af;
  background-color:white;
  filter: drop-shadow(2px 4px 6px blue);
  /*border: 1px solid blue;*/
  border-radius: 15px 15px 15px 15px;
  display: inline-block;
  /*padding: 7px 10px;*/
  padding: 6px 9px;
  
  text-decoration: none;
}
`;



const applyStyleRules = (styleRules) => {
  const sheet = document.createElement('style')
  sheet.innerHTML = styleRules;
  document.body.appendChild(sheet);
}

/**
 * Handles mutation of the Jira board view
 * 
 * @param {*} mutation 
 */
export const handleBoardViewMutation = async (mutation) => {

  enhanceBoard();

  enhanceSelectedIssueCards(BOARD_CARDS_SELECTOR, enhanceBoardCards);

  handleBoardCardAlertIndicatorOutOfPlace(mutation);

  handleBoardIssueEditorDialogClosing(mutation);

  handleInlineBoardIssueEdits(mutation);
}

/**
 * Handles inline board issue edits
 * 
 * @param {*} mutation 
 * @returns 
 */
const handleInlineBoardIssueEdits = (mutation) => {
  const element = mutation.target;

  const boardCard = element.closest(`[data-testid="platform-board-kit.ui.card.card"]`);

  // If the mutation was not to backlog card, no-op
  if(!boardCard) {
    return;
  }

  // If an <INPUT> element has been removed from the board card, this implies that the user has
  // finished editing an attribute of the issue. NOTE: This *doesn't* imply that the user actually made a change, 
  // but for now we just unconditionally update the corrresponding board card
  const removedNodes = mutation.removedNodes;
  if(removedNodes.length) { 
    removedNodes.forEach(
      node => {
        const inputNode = node.querySelector(`input`);
        
        // If an <INPUT> element was removed from the backlog issue editor...
        if(inputNode) {
          
          // Get the key for the issue currently being edited
          const issueKey = getIssueKeyFromBoardCard(boardCard);

          // Update the corresponding backloh issue card
          enhanceBoardCards([getBoardCardFromIssueKey(issueKey)]);
        }
      }
    );
    
  } 
}


/**
 * Enhances the specified board cards. New data will be retrieved.
 * 
 * @param {*} boardCards 
 * @returns 
 */
const enhanceBoardCards = async (boardCards) => {
  return enhanceIssueCards( 
    boardCards,
    getIssueKeyFromBoardCard,
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
    applyBoardCardEnhancements
  );
}

/**
 * Gets the Jira issue key from the given board card
 * 
 * @param {*} boardCard 
 * @returns 
 */
const getIssueKeyFromBoardCard = boardCard => {
  console.log(`jce: getIssueKeyFromBoardCard getAttribute ${boardCard}`);
  const boardCardIssueKey = boardCard?.getAttribute("id").slice('card-'.length);
  return boardCardIssueKey;
}

/**
 * Applies enhancements to the specified card based on the data provided
 * 
 * @param {*} boardCard 
 * @param {*} boardIssueData 
 */
const applyBoardCardEnhancements = (boardCard, boardIssueData) => {
  applyIssueCardEnhancements(boardCard, boardIssueData, enhanceBoardCard);
}

/**
 * Enhances a board card
 * 
 * @param {*} boardCard 
 * @param {*} boardIssueData 
 */
const enhanceBoardCard = (boardCard, boardIssueData) => {

  console.log(`jce: enhanceBoardCard 1 :${boardCard}`);
  var cardColor = "#c1e1c1";

  const alerts = getBoardIssueAlerts(boardIssueData);

  console.log(`jce: enhanceBoardCard 2`);
  if(alerts.length) {
    cardColor = "#fafad2";
  }
  updateBoardCardAlertsIndicator(boardCard, alerts);
  updateAvatar(JIRA_FIELD_IDS.TESTER, "Tester", boardCard, boardIssueData);
  updateAvatar(JIRA_FIELD_IDS.OWNER, "Owner", boardCard, boardIssueData);

  const backlogCardContainer = boardCard.querySelectorAll(`*[data-test-id='platform-card.ui.card.focus-container']`)?.item(0);
  colorizeCard(backlogCardContainer, cardColor);

}

/**
 * Positions the avatar on the board card
 * 
 * @param {*} boardCard 
 * @param {*} avatarWrapper 
 */
const positionAvatar = (boardCard, avatarWrapper) => {
  
  var avatarParent = null;
  avatarParent = boardCard.querySelector('[data-testid="software-board.common.fields.assignee-field-static.avatar-wrapper"]')?.parentElement;

  if(!avatarParent) {
    avatarParent = boardCard.querySelector('[data-testid="software-board.board-container.board.card-container.card.assignee-field.button"]')?.parentElement;
  }

  avatarParent.setAttribute("style", `gap: 0px`);  

  avatarParent.insertAdjacentElement(`afterbegin`, avatarWrapper);
}

const getBoardCardAvatarWrapper = (boardCard, fieldId) => {
  return boardCard?.querySelector(`[id="${fieldId}"]`);
}

const updateAvatar = (jiraFieldId, fieldDisplayName, boardCard, issueData) => {
  console.log(`jce: updateAvatar 1`);

  var avatarWrapper = getBoardCardAvatarWrapper(boardCard, jiraFieldId);

  if(avatarWrapper) {
    avatarWrapper.remove();
  }

  avatarWrapper = document.createElement("div");
  avatarWrapper.setAttribute("id", jiraFieldId);
  
  positionAvatar(boardCard, avatarWrapper);

  console.log(`jce: updateAvatar: ${JSON.stringify(issueData.fields, null, 2)}`);

  const avatarRoot = createRoot(avatarWrapper);
  avatarRoot.render(<UserAvatar fieldDisplayName={fieldDisplayName} userData={issueData.fields[jiraFieldId]?.[0]}/>);
}

/**
 * Get any alerts based on the specified issue data
 * 
 * @param {*} issueData 
 * @returns an array of alert message strings
 */
const getBoardIssueAlerts = (issueData) => {
  const boardIssueAlerts = [];

  if(!issueData.fields[JIRA_FIELD_IDS.STORY_POINT_ESTIMATE] && !(isBug(issueData) || getLabels(issueData).includes(JIRA_LABELS.WONT_ESTIMATE)) ) {

    boardIssueAlerts.push(`Needs Estimate`);
  }
  
  if(!issueData.fields[JIRA_FIELD_IDS.OWNER]) {

    boardIssueAlerts.push(`Needs Owner`);
  }

  if(!issueData.fields[JIRA_FIELD_IDS.TESTER]) {

    boardIssueAlerts.push(`Needs Tester`);
  }

  if(!issueData.fields[JIRA_FIELD_IDS.ASSIGNEE] && !(isDone(issueData) || isReadyForQA(issueData))) {

    boardIssueAlerts.push(`Needs Assignee`);
  }
  
  return boardIssueAlerts;
}

/**
 * Adds the alert indicator to the card if there are alerts, clears it otherwise.
 * 
 * @param {*} boardCard 
 * @param {*} alerts 
 */
const updateBoardCardAlertsIndicator = (boardCard, alerts) => {
  console.log(`jce: updateBoardCardAlertsIndicator 1`);
  
  var alertsIndicatorWrapper = getBoardCardAlertsIndicatorWrapper(boardCard);

  // Remove the alerts indicator, if any
  if(alertsIndicatorWrapper) {
    alertsIndicatorWrapper.remove();
  }
  
  // Add the alerts indicator if there are alerts
  if(alerts.length) {

    console.log(`jce: updateBoardCardAlertsIndicator 3`);
    alertsIndicatorWrapper = document.createElement("div");
    alertsIndicatorWrapper.setAttribute("id", ALERTS_INDICATOR_WRAPPER_ID);
    alertsIndicatorWrapper.setAttribute("style", "margin-left: 4px;");
    
    positionAlertsIndicator(boardCard, alertsIndicatorWrapper);

    console.log(`jce: updateBoardCardAlertsIndicator 5`);
    const alertsIndicatorRoot = createRoot(alertsIndicatorWrapper);
    alertsIndicatorRoot.render(<AlertsIndicator alerts={alerts} />);
  } 
}

/**
 * Gets the element where the react AlertsIndicator component should be inserted
 * 
 * @param {*} boardCard 
 * @returns 
 */
const getBoardCardAlertsIndicatorWrapper = boardCard => {
  return boardCard?.querySelector(`[id="${ALERTS_INDICATOR_WRAPPER_ID}"]`);
}


/**
 * Positions the alert indicator to the right of the board card assignee avatar
 * 
 * @param {*} boardCard 
 * @param {*} alertsIndicatorWrapper 
 */
const positionAlertsIndicator = (boardCard, alertsIndicatorWrapper) => {
  
  var alertsIndicatorParent = null;
  alertsIndicatorParent = boardCard.querySelector('[data-testid="software-board.common.fields.assignee-field-static.avatar-wrapper"]')?.parentElement;

  if(!alertsIndicatorParent) {
    alertsIndicatorParent = boardCard.querySelector('[data-testid="software-board.board-container.board.card-container.card.assignee-field.button"]')?.parentElement;
  }

  alertsIndicatorParent.insertAdjacentElement(`beforeend`, alertsIndicatorWrapper);
}

/**
 * Handles when the issue editor dialog closes
 * 
 * @param {*} mutation 
 */
const handleBoardIssueEditorDialogClosing = (mutation) => {

  mutation.removedNodes.forEach(
    removedNode => {
      console.log(`jce: NODE REMOVED`);
      describeNode(removedNode);
      
      if( isBoardIssueEditorDialog(removedNode)) {
        console.log(`jce: Board Issue Editor Closing Foo`);

        const issueKey  = getIssueKeyFromBoardIssueEditorDialog(removedNode);
        console.log(`jce: foundIssueIdContainer: ${issueKey}`);

        enhanceBoardCards([getBoardCardFromIssueKey(issueKey)]);
        
      }
    }
  );
}

const foo = async () => {
  (await waitForElementToExist('[class="fiolfg-1 eYRRDc css-2b74hb"]')).click();
  console.log('The element exists 1');
  (await waitForElementToExist('[data-test-id="filters.common.ui.list.menu.list"]')).click();
  console.log('The element exists 2');
  (await waitForElementToExist('[data-testid="software-board.header.title.container"]')).click();
}

function waitForElementToExist(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
    });
  });
}

/**
 * Returns true if the node is the board issue editor dialog
 * 
 * @param {*} node 
 * @returns 
 */
const isBoardIssueEditorDialog = (node) => {
  return node.nodeType === Node.ELEMENT_NODE && node.getAttribute(`class`) === ` css-12aymf5`;
}

/**
 * Gets jira issue key for the issue being edited by the editor dialog
 * 
 * @param {*} boardIssueEditorDialog 
 * @returns 
 */
const getIssueKeyFromBoardIssueEditorDialog = (boardIssueEditorDialog) => {
  return boardIssueEditorDialog.querySelector(`*[data-testid='issue.views.issue-base.foundation.breadcrumbs.current-issue.item'] span`).textContent;
}

/**
 * Returns the board card for the specified issue key
 * @param {*} issueKey 
 * @returns 
 */
const getBoardCardFromIssueKey = (issueKey) => {
  return document.querySelector(getSelectorForBoardCard(issueKey));
}

/**
 * Repositions the alerts indicator if it was moved (by jira)
 * 
 * @param {*} mutation 
 * @returns 
 */
const handleBoardCardAlertIndicatorOutOfPlace = (mutation) => {
  const boardCard = getClosestBoardCard(mutation.target);

  if(!boardCard) {
    return;
  }
  const alertsIndicatorInsertionPoint = getBoardCardAlertsIndicatorWrapper(boardCard);

  if(alertsIndicatorInsertionPoint) {

    const alertsIndicatorInsertionPointParent = alertsIndicatorInsertionPoint.parentElement;

    if(alertsIndicatorInsertionPointParent.lastElementChild != alertsIndicatorInsertionPoint) {

      positionAlertsIndicator(boardCard, alertsIndicatorInsertionPoint);
    }
  }
}


/**
 * Returns the board card associated with this element, if any.
 * 
 * @param {*} boardCardElement 
 * @returns 
 */
const getClosestBoardCard = boardCardElement => {
  return boardCardElement.closest(`[id^="card-"][data-test-id="platform-board-kit.ui.card.card"]`);
}

/**
 * Gets the Jira board card element for the specified issue key
 * 
 * @param {*} issueKey 
 * @returns 
 */

const getSelectorForBoardCard = (issueKey) => {
  return BOARD_CARDS_SELECTOR + `[id="card-${issueKey}"]`;
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


const describeNode = (node) => {
  console.log(`  jce: Node: ${node.nodeName} ${node.nodeType}`);
  if(node.attributes) {
    for (const attr of node.attributes) {
      console.log(`     ${attr.name}=${attr.value}`);
    }
  }
}