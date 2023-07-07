import React from 'react';
import AlertsIndicator from './AlertsIndicator';
import { createRoot } from 'react-dom/client';


// ak-jira-navigation

import {getIssueData, JIRA_FIELD_IDS} from './jiraApiUtils'

const MODIFIED_BY_EXTENSION_ATTRIBUTE_NAME = 'modified-by-extension';

const BACKLOG_CARDS_SELECTOR = '[data-test-id="software-backlog.backlog-content.scrollable"] *[data-test-id^="software-backlog.card-list.card.content-container"]';
const BOARD_CARDS_SELECTOR = '*[data-test-id="software-board.board"] *[data-testid="platform-board-kit.ui.card.card"]';

console.log('jce: Content script running 2..')

const colorizeCard = (issueCard, color) => {
  issueCard?.setAttribute("style", `background-color:${color}`);  
}

/**
 * Gets the issue cards that need to be modified
 * 
  * @returns 
 */
const getIssueCardsThatNeedModification = (cardSelector) => {
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

const modifyBoardCard = (boardCard, boardIssueData) => {

  var cardColor = "#c1e1c1";

  const alerts = getBoardIssueAlerts(boardIssueData);

  if(alerts.length) {
    insertBoardCardAlertsIndicator(boardCard, alerts);

    cardColor = "#fafad2";
  }

  const backlogCardContainer = boardCard.querySelectorAll(`*[data-test-id='platform-card.ui.card.focus-container']`)?.item(0);
  colorizeCard(backlogCardContainer, cardColor);

}

const insertBoardCardAlertsIndicator = (boardCard, alerts) => {
  const bottomRightCardTray = boardCard.getElementsByClassName(`y8i3hb-5 isqqjW`).item(0);

  const alertsIndicatorInsertionPoint = document.createElement("div");
  alertsIndicatorInsertionPoint.setAttribute("id", "alertsIndicatorInsertionPoint");
  bottomRightCardTray.insertBefore(alertsIndicatorInsertionPoint, null);
  

  const alertsIndicatorRoot = createRoot(alertsIndicatorInsertionPoint); // createRoot(container!) if you use TypeScript
  alertsIndicatorRoot.render(<AlertsIndicator alerts={alerts} />);
}

const getBoardIssueAlerts = (boardIssueData) => {
  const boardIssueAlerts = [];

  /*
  JIRA_FIELD_IDS.ASSIGNEE,
      JIRA_FIELD_IDS.KEY,
      JIRA_FIELD_IDS.LABELS,
      JIRA_FIELD_IDS.OWNER,
      JIRA_FIELD_IDS.PAIR_ASSIGNEE, 
      JIRA_FIELD_IDS.STORY_POINT_ESTIMATE,
      JIRA_FIELD_IDS.TESTER
      */


  if(!boardIssueData.fields[JIRA_FIELD_IDS.STORY_POINT_ESTIMATE]) {

    boardIssueAlerts.push(`Needs Estimate`);
  }
  
  if(!boardIssueData.fields[JIRA_FIELD_IDS.OWNER]) {

    boardIssueAlerts.push(`Needs Owner`);
  }

  if(!boardIssueData.fields[JIRA_FIELD_IDS.OWNER]) {

    boardIssueAlerts.push(`Needs Tester`);
  }

  if(!boardIssueData.fields[JIRA_FIELD_IDS.ASSIGNEE]) {

    boardIssueAlerts.push(`Needs Assignee`);
  }
  

  return boardIssueAlerts;
}

const applyBoardCardModifications = (boardCard, boardIssueData) => {
  applyIssueCardModifications(boardCard, boardIssueData, modifyBoardCard);
}

const applyBacklogCardModifications = (backlogCard, backlogIssueData) => {
  applyIssueCardModifications(backlogCard, backlogIssueData, modifyBacklogCard);
}

const applyIssueCardModifications = (issueCard, issueData, modifyIssueCard) => {
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

const modifyBoardCards = async () => {
  return modifyIssueCards( 
    BOARD_CARDS_SELECTOR,
    getIssueKeyFromBoardCard,
    [
      JIRA_FIELD_IDS.ASSIGNEE,
      JIRA_FIELD_IDS.KEY,
      JIRA_FIELD_IDS.LABELS,
      JIRA_FIELD_IDS.OWNER,
      JIRA_FIELD_IDS.PAIR_ASSIGNEE, 
      JIRA_FIELD_IDS.STORY_POINT_ESTIMATE,
      JIRA_FIELD_IDS.TESTER
    ],
    applyBoardCardModifications
  );
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

/**
 * Gets the Jira issue key from the given board card
 * 
 * @param {*} boardCard 
 * @returns 
 */
const getIssueKeyFromBoardCard = boardCard => {
  
  const boardCardIssueKey = boardCard?.getAttribute("id").slice('card-'.length);
  return boardCardIssueKey;
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
 * Observe mutations and update the backlog as necessary
 */
const observer = new MutationObserver(
  mutations => {  
    mutations.map(
      mutation => {
        const target = mutation.target;
        modifyBacklogCards();
        modifyBoardCards();
        console.log(`jce: handling mutation: node type2: ${target}`);

        logAttributes(target);
        
         console.log(`jce: Text Content1: ${target.textContent}`);
         console.log(`Text Content: ${target.nodeValue}`);

         if(target.textContent.includes(`Projected`) && !target.textContent.includes(`Foo`)) {
          console.log(`jce: PARENT`); 
          logAttributes(target.parentNode);          
        }
      }       
    )
  }    
);

const logAttributes = node => {
  const attributes = node.attributes;

  if(attributes) {
    for (const attr of attributes) {
      console.log(`jce: ${attr.name} -> ${attr.value}`);
    }
  }
}

const target = document.querySelector("html");
const config = { childList:true, subtree:true};

/**
 * Observe all mutations to the DOM
 * TODO: Optimize this later if necessary
 */

observer.observe(target, config);