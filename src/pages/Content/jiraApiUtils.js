import _ from 'lodash';

const JIRA_FIELDS_ID = "fields";

// Jira Field Ids
export const JIRA_FIELD_IDS = {
   ASSIGNEE: "assignee",
   FLAGGED: "customfield_10021",
   ID:"id",
   ISSUE_TYPE: "issuetype",
   KEY: "key",
   LABELS: "labels",
   OWNER: "customfield_10152",
   PAIR_ASSIGNEE: "customfield_10174", 
   STATUS:"status",
   STATUS_CATEGORY:"statusCategory",
   STORY_POINT_ESTIMATE: "customfield_10016",
   TESTER: "customfield_10127" 
};

export const JIRA_ISSUE_TYPES = {
  BUG: "10044",
  EPIC:"10045",
  SPIKE:"10047",
  STORY: "10042",
  TASK: "10043"
};

export const JIRA_STATUS_CATEGORIES = {
  DONE: 3,
  IN_PROGRESS:4,
  TO_DO:2
};

export const JIRA_STATUSES = {
  DONE:"10087",
  DUPLICATE:"10101",
  IN_PROGRESS:"10086",
  IN_QA:"10100",
  READY_FOR_QA: "10099",
  TO_DO: "10085",
  WONT_DO:"10102"
};

export const JIRA_LABELS = {
  WONT_ESTIMATE: "wont_estimate"
};

/**
 * Issue a generic Jira API request
 * @param {*} param0 
 * @returns 
 */
export const makeJiraApiRequest = async (
  {
    method='POST',
    requestPath= "",
    body
  }
) => {
  const BASE_JIRA_API_PATH = '/rest/api/3';

  const response = await fetch(
    `${BASE_JIRA_API_PATH}/${requestPath}`,
    {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    }
  );

  return await response?.json();
}

/**
 * JQL Request 
 * Returns full depaginated results
 * 
 * @param {*} param0 
 * @returns 
 */
export const makeJqlRequest = async (
  {
    jql,
    fields = [],
    resultPropertyPath = "issues",
    maxResults = 50
  }
) => {
  
  var startAt = 0;
  var allResultsReturned = []
  var totalNumberOfResults = 0;

  do {
    const response = await makeJiraApiRequest(
      {
        requestPath: "search",
        body: {
          jql,
          fields,
          startAt,
          maxResults
        }
      }
    );
    
    totalNumberOfResults = response?.total;
    allResultsReturned = 
      allResultsReturned.concat(
        _.get(response, resultPropertyPath, [])
      );
    console.log(`jce: Got ${allResultsReturned.length} of ${totalNumberOfResults} results for jql ${jql}`);
    startAt = allResultsReturned?.length;
  }while(totalNumberOfResults>allResultsReturned.length);

  return allResultsReturned;
  
}

/**
 * Get issue data for the issue keys
 * 
 * @param {*} issueKeys 
 * @param {*} fields 
 * @returns 
 */
export const getIssueData = async (issueKeys, fields=[]) => {

  if(!issueKeys.length) {
    return [];
  }
  
  const jql = `key in (${issueKeys.join()})`;
  //const jql = `key in (DOPE-280)`;
  console.log(`jce: getIssuesForKeys: number of keys: ${issueKeys?.length}}`);
  console.log(`jce: getIssuesForKeys: jql: ${jql}}`);

  const issueData = await makeJqlRequest(
    {
      jql,
      fields,
      maxResults:5000
    }
  );

  //console.log(`jce: getIssuesForKeys: ${JSON.stringify(issueData, null, 2)}`);
  //console.log(`jce: getIssuesForKeys: issueData.length: ${issueData.length}`);

  return issueData;
  
}

export const isFlagged = (issueData) => {
  return issueData[JIRA_FIELDS_ID][JIRA_FIELD_IDS.FLAGGED];
}

export const isBug = (issueData) => {
  const isBug = issueData[JIRA_FIELDS_ID][JIRA_FIELD_IDS.ISSUE_TYPE][JIRA_FIELD_IDS.ID] === JIRA_ISSUE_TYPES.BUG;
  return isBug;
}

export const isReadyForQA = (issueData) => {
  const isReadyForQA = issueData[JIRA_FIELDS_ID][JIRA_FIELD_IDS.STATUS][JIRA_FIELD_IDS.ID]  === JIRA_STATUSES.READY_FOR_QA;
  return isReadyForQA;
}

export const isDone = (issueData) => {
  const isDone = issueData[JIRA_FIELDS_ID][JIRA_FIELD_IDS.STATUS][JIRA_FIELD_IDS.STATUS_CATEGORY][JIRA_FIELD_IDS.ID] === JIRA_STATUS_CATEGORIES.DONE;
  return isDone;
}

export const getLabels = (issueData) => {
  return issueData[JIRA_FIELDS_ID][JIRA_FIELD_IDS.LABELS]
}

