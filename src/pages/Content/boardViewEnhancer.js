import React from 'react';
import AlertsIndicator from './AlertsIndicator';
import UserAvatar from './UserAvatar';
import { createRoot } from 'react-dom/client';
import {JIRA_FIELD_IDS, JIRA_LABELS, getLabels, isBug, isDone, isReadyForQA, isFlagged} from './jiraApiUtils'
import { enhanceIssueCards, enhanceSelectedIssueCards, applyIssueCardEnhancements } from './jiraViewEnhancer';
import { addQuickFilters, handleQuickFiltersMutation } from './filtersEnhancer';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Markdown from 'react-markdown';


const BOARD_CARDS_SELECTOR = '*[data-test-id="software-board.board"] *[data-testid="platform-board-kit.ui.card.card"]';

const ALERTS_INDICATOR_WRAPPER_ID = 'ALERTS_INDICATOR_WRAPPER_ID';

const SPRINT_GOALS_MARKDOWN_WRAPPER_ID="SPRINT_GOALS_MARKDOWN_WRAPPER_ID";
/**
 * Returns true if the Jira board is diplayed 
 * 
 * @returns 
 */
export const isBoardView = () => {
  return !!document.querySelector('[data-test-id="software-board.board"]');
}

/**
 * Gets the DOM element that wraps the sprint goals markdown
 * 
 * @returns 
 */
const getSprintGoalsMarkdownWrapper = () => {
  return document.querySelector(`[id="${SPRINT_GOALS_MARKDOWN_WRAPPER_ID}"]`);
}


/**
 * Adds the Sprint Goals Markdown if necessary
 * 
 * @returns 
 */
const addSprintGoalsMarkdown = () => {
  const unformattedSprintGoalsEl = getUnformattedSprintGoalsEl();
  // If the sprint goals markdown has alreay been added, do nothing
  if( !unformattedSprintGoalsEl || getSprintGoalsMarkdownWrapper() ) {
    return;
  }
  // Hide Jira's built in unformatted sprint goals element
  unformattedSprintGoalsEl.style.display="none";

  // Create the wrapper element for the sprint goals markdown component
  const sprintGoalsMarkdownWrapper = document.createElement("div");
  sprintGoalsMarkdownWrapper.setAttribute("id", SPRINT_GOALS_MARKDOWN_WRAPPER_ID);  
  
  // Add the sprint goals mark down wrapper as a sibling to the unformatted sprint goals element
  unformattedSprintGoalsEl.insertAdjacentElement(`afterend`, sprintGoalsMarkdownWrapper);

  updateGoalsMarkdown();
  
}

/**
 * Gets the element Jira uses to display the unformatted sprint goals
 * 
 * @returns 
 */
const getUnformattedSprintGoalsEl = () => {
  const titleParentEl = document.querySelector(`[data-testid="software-board.header.title.container"]`).parentElement;
  
  const sprintGoalsEl = titleParentEl.querySelector(`:scope > :not(#${SPRINT_GOALS_MARKDOWN_WRAPPER_ID}):not([data-testid="software-board.header.title.container"])`);

  /*if(sprintGoalsEl) {
    sprintGoalsEl.style.display="none";
  }*/
  return sprintGoalsEl;
}

const updateGoalsMarkdown = () => {
  const unformattedSprintGoalsEl = getUnformattedSprintGoalsEl();
  const sprintGoalsMarkdownWrapper = getSprintGoalsMarkdownWrapper()
  
  // Hide the unformatted sprint goals element if it exists
  if(unformattedSprintGoalsEl) {
    unformattedSprintGoalsEl.style.display="none";
  }

  // Remove the old sprint goals markdown component, if any
  sprintGoalsMarkdownWrapper?.firstChild?.remove();

  // Render insert and render the sprint goals markdown component
  const sprintGoalsMarkdownRoot = createRoot(sprintGoalsMarkdownWrapper);
  
  const sprintGoalsText = unformattedSprintGoalsEl?.innerText??"";
  /*sprintGoalsMarkdownRoot.render(<Markdown><Accordion/>{unformattedSprintGoalsEl?.innerText??""}</Markdown>
  );*/
  sprintGoalsMarkdownRoot.render(
    <Accordion  elevation={0} disableGutters={true}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2a-content"
          id="panel2a-header"
          sx={{
            minHeight: 0,
            "&.Mui-expanded": {
              minHeight: 0
            },
            "& .MuiAccordionSummary-content": {
              margin: 0,
            },
            "& .MuiAccordionSummary-content.Mui-expanded": {
              margin: 0
            }
          }}
  
        >
          <Markdown>{getSprintGoalsSummary(sprintGoalsText)}</Markdown>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            paddingTop: 0,
            paddingBottom: 0
          }}
        >
          <Markdown>{getSprintGoalsDetails(sprintGoalsText)}</Markdown>
        </AccordionDetails>
      </Accordion>
    
  );
}

const getSprintGoalsSummary = (sprintGoalsText) => {
  const lineBreakIndex = sprintGoalsText.indexOf(`\\`);

  return lineBreakIndex>=0?sprintGoalsText.substring(0, lineBreakIndex):sprintGoalsText;
}

const getSprintGoalsDetails = (sprintGoalsText) => {
  const lineBreakIndex = sprintGoalsText.indexOf(`\\`);

  return lineBreakIndex>=0?sprintGoalsText.substring(lineBreakIndex+1):sprintGoalsText;
}

const adjustControlsBarMargins = (controlsBarEl) => {
  controlsBarEl?.parentElement?.setAttribute("style", `margin-bottom:0;`);  
  controlsBarEl?.parentElement?.parentElement?.setAttribute("style", `margin-top:0;`);  
}

/**
 * Handles mutation of the Jira board view
 * 
 * @param {*} mutation 
 */
export const handleBoardViewMutation = async (mutation) => {

  const controlsBarEl = document.querySelector('[data-testid="software-board.header.controls-bar"]');
  addQuickFilters(controlsBarEl.parentElement.parentElement);

  adjustControlsBarMargins(controlsBarEl);

  addSprintGoalsMarkdown();

  enhanceSelectedIssueCards(BOARD_CARDS_SELECTOR, enhanceBoardCards);

  handleBoardCardAlertIndicatorOutOfPlace(mutation);

  handleBoardIssueEditorDialogClosing(mutation);

  handleInlineBoardIssueEdits(mutation);

  handleQuickFiltersMutation(mutation);

  handleSprintEditorDialogClosing(mutation);
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
  var cardColor = "#c1e1c1"; //green

  const alerts = getBoardIssueAlerts(boardIssueData);

  console.log(`jce: enhanceBoardCard 2`);
  if(alerts.length) {
    cardColor = "#fafad2"; //yellow
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

  if( getLabels(issueData).includes(JIRA_LABELS.READY_TO_WORK) ) {
    return boardIssueAlerts;
  }

  if(isFlagged(issueData) ) {

    boardIssueAlerts.push(`Flagged!`);
  }

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
        console.log(`jce: Board Issue Editor Closing`);

        const issueKey  = getIssueKeyFromBoardIssueEditorDialog(removedNode);
        console.log(`jce: foundIssueIdContainer: ${issueKey}`);

        enhanceBoardCards([getBoardCardFromIssueKey(issueKey)]);
      }
    }
  );
}

/**
 * Handles when the sprint editor dialog closes
 * 
 * @param {*} mutation 
 */
const handleSprintEditorDialogClosing = (mutation) => {

  mutation.removedNodes.forEach(
    removedNode => {
      if( isSprintEditorDialog(removedNode)) {
        // Updates the sprint goals
        updateGoalsMarkdown();
      }
    }
  );
}

/**
 * Returns true if the node is the sprint editor dialog
 * 
 * @param {*} node 
 * @returns 
 */
const isSprintEditorDialog = (node) => {
  return  (
      node.nodeType === Node.ELEMENT_NODE &&  
      node.querySelector(`*[role='dialog']`) && 
      node.querySelector(`span[id^='modal-dialog-title']`)?.innerText?.startsWith(`Edit sprint:`)
    );
}


/**
 * Returns true if the node is the board issue editor dialog
 * 
 * @param {*} node 
 * @returns 
 */
const isBoardIssueEditorDialog = (node) => {
  return (
    node.nodeType === Node.ELEMENT_NODE &&  
    node.querySelector(`*[role='dialog']`) && 
    getIssueKeyFromBoardIssueEditorDialog(node)
  );
}

/**
 * Gets jira issue key for the issue being edited by the editor dialog
 * 
 * @param {*} boardIssueEditorDialog 
 * @returns 
 */
const getIssueKeyFromBoardIssueEditorDialog = (boardIssueEditorDialog) => {
  return boardIssueEditorDialog?.querySelector(`*[data-testid='issue.views.issue-base.foundation.breadcrumbs.current-issue.item'] span`)?.textContent;
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
  return boardCardElement.closest(`[id^="card-"][data-testid="platform-board-kit.ui.card.card"]`);
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