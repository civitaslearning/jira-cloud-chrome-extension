import _ from 'lodash';


// Jira Field Ids
export const JIRA_FIELD_IDS = {
   ASSIGNEE: "assignee",
   KEY: "key",
   LABELS: "labels",
   OWNER: "customfield_10152",
   PAIR_ASSIGNEE: "customfield_10174", 
   STORY_POINT_ESTIMATE: "customfield_10016",
   TESTER: "customfield_10127"
   
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