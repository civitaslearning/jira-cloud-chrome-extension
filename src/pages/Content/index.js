import React from 'react';
import AlertsIndicator from './AlertsIndicator';
import { createRoot } from 'react-dom/client';


export const JIRA_VIEW = {
  BACKLOG: "backlog",
  BOARD:"board",
  UNKNOWN:"unknown"
};

// ak-jira-navigation

import {getIssueData, JIRA_FIELD_IDS, isBug, isDone} from './jiraApiUtils'

const MODIFIED_BY_EXTENSION_ATTRIBUTE_NAME = 'modified-by-extension';

const BACKLOG_CARDS_SELECTOR = '[data-test-id="software-backlog.backlog-content.scrollable"] *[data-test-id^="software-backlog.card-list.card.content-container"]';
const BOARD_CARDS_SELECTOR = '*[data-test-id="software-board.board"] *[data-testid="platform-board-kit.ui.card.card"]';


console.log('jce: Content script running...')

const getJiraView = () => {
  if (isBacklogView()) {
    return JIRA_VIEW.BACKLOG;
  }

  if (isBoardView()) {
    return JIRA_VIEW.BOARD;
  }

  return JIRA_VIEW.UNKNOWN;
}

const isBoardView = () => {
  return !!document.querySelector('[data-test-id="software-board.board"]');
}

const isBacklogView = () => {
  return !!document.querySelector('[data-test-id="software-backlog.backlog-content.scrollable"]');
}

const getSelectorForBoardCard = (issueKey) => {
  return BOARD_CARDS_SELECTOR + `[id="card-${issueKey}"]`;
}

const colorizeCard = (issueCard, color) => {
  issueCard?.setAttribute("style", `background-color:${color}`);  
}

/**
 * Gets the issue cards that need to be modified
 * 
  * @returns 
 */
const selectIssueCards = (cardSelector) => {
  return [...document.querySelectorAll(`${cardSelector}:not([${MODIFIED_BY_EXTENSION_ATTRIBUTE_NAME}])`)];
}

const modifyBacklogCard = (backlogCard, backlogIssueData) => {
  const backlogCardContainer = backlogCard.querySelectorAll(`*[data-testid='software-backlog.card-list.card.card-contents.card-container']`)?.item(0);

  var cardColor;
  if(backlogIssueData.fields[JIRA_FIELD_IDS.STORY_POINT_ESTIMATE]) {
    cardColor = "#c1e1c1";
  } else {
    cardColor = "#fafad2";
  }
  colorizeCard(backlogCardContainer, cardColor);
}

const enhanceBoardCard = (boardCard, boardIssueData) => {

  console.log(`jce: enhanceBoardCard 1 :${boardCard}`);
  var cardColor = "#c1e1c1";

  const alerts = getBoardIssueAlerts(boardIssueData);

  console.log(`jce: enhanceBoardCard 2`);
  if(alerts.length) {
    cardColor = "#fafad2";
  }
  updateBoardCardAlertsIndicator(boardCard, alerts);

  const backlogCardContainer = boardCard.querySelectorAll(`*[data-test-id='platform-card.ui.card.focus-container']`)?.item(0);
  colorizeCard(backlogCardContainer, cardColor);

}

const updateBoardCardAlertsIndicator = (boardCard, alerts) => {
  console.log(`jce: updateBoardCardAlertsIndicator 1`);
  const ALERTS_INDICATOR_INSERTION_POINT_ID = 'ALERTS_INDICATOR_INSERTION_POINT_ID';

  
  const bottomRightCardTray = boardCard.getElementsByClassName(`y8i3hb-5`).item(0);

  console.log(`jce: updateBoardCardAlertsIndicator 2`);
  var alertsIndicatorInsertionPoint = boardCard.querySelector(`*[id='${ALERTS_INDICATOR_INSERTION_POINT_ID}']`);

  if(alertsIndicatorInsertionPoint) {
    alertsIndicatorInsertionPoint.remove();
  }
  
  if(alerts.length) {
    console.log(`jce: updateBoardCardAlertsIndicator 3`);
    alertsIndicatorInsertionPoint = document.createElement("div");
    alertsIndicatorInsertionPoint.setAttribute("id", ALERTS_INDICATOR_INSERTION_POINT_ID);
    //bottomRightCardTray.insertBefore(alertsIndicatorInsertionPoint, null);
    bottomRightCardTray.insertAdjacentElement(`beforeend`, alertsIndicatorInsertionPoint);

    console.log(`jce: updateBoardCardAlertsIndicator 5`);
    const alertsIndicatorRoot = createRoot(alertsIndicatorInsertionPoint);
    alertsIndicatorRoot.render(<AlertsIndicator alerts={alerts} />);
  }
  
}

const positionBoardCardAlertsIndicator = (alertsIndicatorInsertionPoint) => {

}

const getBoardIssueAlerts = (issueData) => {
  const boardIssueAlerts = [];

  if(!issueData.fields[JIRA_FIELD_IDS.STORY_POINT_ESTIMATE] && !isBug(issueData)) {

    boardIssueAlerts.push(`Needs Estimate`);
  }
  
  if(!issueData.fields[JIRA_FIELD_IDS.OWNER]) {

    boardIssueAlerts.push(`Needs Owner`);
  }

  if(!issueData.fields[JIRA_FIELD_IDS.TESTER]) {

    boardIssueAlerts.push(`Needs Tester`);
  }

  if(!issueData.fields[JIRA_FIELD_IDS.ASSIGNEE] && !isDone(issueData)) {

    boardIssueAlerts.push(`Needs Assignee`);
  }
  

  return boardIssueAlerts;
}

const applyBoardCardEnhancements = (boardCard, boardIssueData) => {
  applyIssueCardEnhancements(boardCard, boardIssueData, enhanceBoardCard);
}

const applyBacklogCardEnhancements = (backlogCard, backlogIssueData) => {
  applyIssueCardEnhancements(backlogCard, backlogIssueData, modifyBacklogCard);
}

const applyIssueCardEnhancements = (issueCard, issueData, modifyIssueCard) => {
  issueCard.setAttribute(MODIFIED_BY_EXTENSION_ATTRIBUTE_NAME, 'true');
  modifyIssueCard(issueCard, issueData);
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

const describeNode = (node) => {
  console.log(`  jce: Node: ${node.nodeName} ${node.nodeType}`);
  if(node.attributes) {
    for (const attr of node.attributes) {
      console.log(`     ${attr.name}=${attr.value}`);
    }
  }
}

const handleBoardIssueEditorClosing = (mutation) => {
  if(mutation.addedNodes.length) {
    mutation.addedNodes.forEach(
      addedNode => {
        if(addedNode.nodeType === Node.ELEMENT_NODE) {
          console.log(`jce: NODE ADDED`);
          describeNode(addedNode);
        }
      }
    )
  }
  mutation.removedNodes.forEach(
    removedNode => {
      console.log(`jce: NODE REMOVED`);
      describeNode(removedNode);
      
      if(removedNode.nodeType === Node.ELEMENT_NODE && removedNode.getAttribute(`class`) === ` css-12aymf5`) {
        console.log(`jce: Board Issue Editor Closing Foo`);

        //const issueIdContainer = removedNode.querySelector("*[data-testid=`issue.views.issue-base.foundation.breadcrumbs.current-issue.item`]");
        const issueKey  = removedNode.querySelector(`*[data-testid='issue.views.issue-base.foundation.breadcrumbs.current-issue.item'] span`).textContent;
        console.log(`jce: foundIssueIdContainer: ${issueKey}`);

        enhanceBoardCards([getBoardCardFromIssueKey(issueKey)]);
      }
    }
  );
}

const handleBoardCardAlertIndicatorOutOfPlace = (mutation) => {
  const boardCard = getClosestBoardCard(mutation.target);

  if(!boardCard) {
    return;
  }
  const alertsIndicatorInsertionPoint = getBoardCardAlertsIndicatorInsertionPoint(boardCard);

  if(alertsIndicatorInsertionPoint) {

    const alertsIndicatorInsertionPointParent = alertsIndicatorInsertionPoint.parentElement;

    if(alertsIndicatorInsertionPointParent.lastElementChild != alertsIndicatorInsertionPoint) {

      alertsIndicatorInsertionPointParent.insertAdjacentElement("beforeend", alertsIndicatorInsertionPoint);
    }
  }
}

const getBoardCardAlertsIndicatorInsertionPoint = boardCard => {
  return boardCard?.querySelector(`[id="ALERTS_INDICATOR_INSERTION_POINT_ID"]`);
}

const handleBoardViewMutation = async (mutation) => {
  handleBoardCardAlertIndicatorOutOfPlace(mutation);

  enhanceSelectedIssueCards(BOARD_CARDS_SELECTOR, enhanceBoardCards);
}

const enhanceBacklog = async () => {
  return enhanceSelectedIssueCards(BACKLOG_CARDS_SELECTOR, enhanceBacklogCards);
}

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

const enhanceSelectedIssueCards = (issueCardSelector, issueCardsModifier) => {
  const issueCards = selectIssueCards(issueCardSelector);

  issueCardsModifier(issueCards);
}



const enhanceIssueCards = async (issueCards, getIssueKeyFromCard, issueFields, applyIssueCardModification) => {
  

  issueCards.map(
    issueCard => {
      issueCard.setAttribute(MODIFIED_BY_EXTENSION_ATTRIBUTE_NAME, 'true');
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

const getBoardCardFromIssueKey = (issueKey) => {
  return document.querySelector(getSelectorForBoardCard(issueKey));
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

const getClosestBoardCard = boardCardElement => {
  return boardCardElement.closest(`[id^="card-"][data-test-id="platform-board-kit.ui.card.card"]`);
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
        /*
        const removedNodes = mutation.removedNodes;

        removedNodes.forEach(
          removedNode => {
            console.log(`jce: MutationObserver getAttribute ${removedNode}`);
            

            
            const nodeClass = removedNode?.getAttribute(`class`);
            
            //const nodeClass = removedNode?.getAttribute(`class`);
            if(nodeClass === ` css-12aymf5`) {
              console.log(`jce: Issue dialog closed`);  

              //const issueIdContainer = removedNode.querySelector("*[data-testid=`issue.views.issue-base.foundation.breadcrumbs.current-issue.item`]");
              const issueKey  = removedNode.querySelectorAll(`*[data-testid='issue.views.issue-base.foundation.breadcrumbs.current-issue.item'] span`)?.item(0).textContent;
              console.log(`jce: foundIssueIdContainer: ${issueKey}`);

              enhanceBoardCards([getBoardCardFromIssueKey(issueKey)]);

              console.log(`jce: foundIssueIdContainer 2: ${issueKey}`);

              // issue.views.issue-base.foundation.breadcrumbs.current-issue.item
            }
            console.log(`jce: Node Removed: ${nodeClass}`);
            //  css-12aymf5
          }
        );
          */
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