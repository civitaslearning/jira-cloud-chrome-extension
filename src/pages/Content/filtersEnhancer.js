
const QUICK_FILTERS_WRAPPER_ID = 'QUICK_FILTERS_WRAPPER_ID';

// A map of maps for quick filter buttons. 
// Keys are filter menu names and map to a map of menu item names to quick filter buttons
// TODO: This is dumb. Use query selectors and attributes on the buttons indicating which filters they belong to.
const quickFiltersButtonMap = new Map();

/**
 * Sets any associated quick filter buttons to the appropriate state based on the filter menu item state
 * 
 * @param {*} filterMenuName 
 */
const syncQuickFilterButtonsWithFilterMenu = async (filterMenuName) => {

  console.log(`syncQuickFilterButtonsWithFilterMenu 1`);
  // Wait for the filter menu button to exist
  await waitForElementToExist(`[data-testid="filters.common.ui.list.${filterMenuName.replace(/\s+/g, '-').toLowerCase()}-filter"]`);

  console.log(`syncQuickFilterButtonsWithFilterMenu 2`);
  // Open the filter menu
  await openFilterMenu(filterMenuName);

  console.log(`syncQuickFilterButtonsWithFilterMenu 3`);

  // Get the checked filter menu items
  const checkedMenuItems = await getCheckedMenuItems(filterMenuName);

  console.log(`syncQuickFilterButtonsWithFilterMenu 4`);

  
  await closeFilterMenu(filterMenuName);

  // Set any quick filter buttons associated with the filter menu to the appropriate state (active or inactive)
  quickFiltersButtonMap?.get(filterMenuName)?.forEach(
    (quickFilterButton, menuItemName) => {

      if(checkedMenuItems.includes(menuItemName)) {
         activateQuickFilterButton(quickFilterButton);
      } else {
        deactivateQuickFilterButton(quickFilterButton);
      }
    }
  );
}

/**
 * Deactivates all the quick filter buttons!
 */
const deactivateAllQuickFilterButtons = () => {
  
  // Get all the active quick filter buttons
  const quickFilterButtons = document.querySelectorAll(`.quick-filter-button-active`);
  
  // Deactive each active button
  quickFilterButtons.forEach(
    quickFilterButton => {
      deactivateQuickFilterButton(quickFilterButton);
    }
  )
}

/**
 * Syncs all quick filter buttons with their corresponding filter menu items state
 */
const syncQuickFilters = async () => {
  // TODO: For now we just support "Custom filters" based Quick Filters.
  // Syncing *all* of the filters here causes annoying flash. Come back to this when/if
  // we want to support other filters.

  //await syncQuickFilterButtonsWithFilterMenu("Version");
  //await syncQuickFilterButtonsWithFilterMenu("Epic");
  //await syncQuickFilterButtonsWithFilterMenu("Label");
  //await syncQuickFilterButtonsWithFilterMenu("Type");
  await syncQuickFilterButtonsWithFilterMenu("Custom filters");
}

/**
 * Gets the checked menu items for the specified menu
 * 
 * @param {*} menuName 
 * @returns 
 */
const getCheckedMenuItems = async (menuName) => {
  const checkedMenuItems = [];

  // Wait for the drop down menu to exist
  const filterMenu = (await waitForElementToExist(`div [id$="-popup-select"]`));

  console.log(`getCheckedMenuItems 0`);
  // Get the checked menu item elements
  const menuItemChecks = filterMenu.querySelectorAll(`[id^="react-select-"] > div > span[style*="selected"]`);
  
  console.log(`getCheckedMenuItems 1`);

  // Get the menu items names associated with each check
  menuItemChecks.forEach(
    menuItemCheck => {
      const menuItemName = menuItemCheck.parentElement.parentElement.textContent;
      console.log(`getCheckedMenuItems: ${menuItemName}`);
      checkedMenuItems.push(menuItemName);
    }
  );

  console.log(`getCheckedMenuItems 2`);
  return checkedMenuItems;
}

/**
 * Adds the quick filter buttons to the view
 * 
 * @param {*} quickFiltersSibling 
 * @returns 
 */

export const addQuickFilters = async (quickFiltersSibling) => {
  // If the quick filters have alreay been added, do nothing
  if( getQuickFiltersWrapper() ) {
    return;
  }

  // Apply the style rules for the quick filter buttons
  applyStyleRules(quickFilterButtonStyleRules);

  // Clear the map of menu items to quick filter buttons
  quickFiltersButtonMap.clear();

  // Create the wrapper and container elements for the quick filters
  const quickFilterWrapper = document.createElement("div");
  quickFilterWrapper.setAttribute("id", QUICK_FILTERS_WRAPPER_ID);  
  quickFilterWrapper.setAttribute("class", `quick-filter-wrapper`);  

  // The quick filters container is an HTML description list 
  const quickFiltersContainer = document.createElement("dl");
  quickFiltersContainer.setAttribute("class", `quick-filters-container`);  

  const quickFiltersTitle = document.createElement("dt");
  quickFiltersTitle.setAttribute("class", `quick-filter-title`);  
  quickFiltersTitle.textContent = "Quick Filters:"
  quickFiltersContainer.appendChild(quickFiltersTitle);

  appendQuickFilterLabel(quickFiltersContainer, "OWNER:");
  appendQuickFilterButton(quickFiltersContainer, "Chris", "Custom filters" , "Owned By Chris");
  appendQuickFilterButton(quickFiltersContainer, "Edward", "Custom filters" , "Owned By Edward");
  appendQuickFilterButton(quickFiltersContainer, "Eric", "Custom filters" , "Owned By Eric");
  appendQuickFilterButton(quickFiltersContainer, "Gus", "Custom filters" , "Owned By Gus");
  appendQuickFilterButton(quickFiltersContainer, "Melissa", "Custom filters" , "Owned By Melissa");
  appendQuickFilterButton(quickFiltersContainer, "Nick", "Custom filters" , "Owned By Nick");
  appendQuickFilterButton(quickFiltersContainer, "PJ", "Custom filters" , "Owned By PJ");
  appendQuickFilterButton(quickFiltersContainer, "None", "Custom filters" , "No Owner");

  appendQuickFilterLabel(quickFiltersContainer, "FOCUS GROUP:");
  appendQuickFilterButton(quickFiltersContainer, "Application", "Custom filters" , "Application Focus Group");
  appendQuickFilterButton(quickFiltersContainer, "Cost/Data", "Custom filters" , "Cost Optimization and Data Integration Focus Group");
  appendQuickFilterButton(quickFiltersContainer, "Modeling", "Custom filters" , "Modeling Focus Group");
  appendQuickFilterButton(quickFiltersContainer, "None", "Custom filters" , "No Focus Group");

  appendQuickFilterLabel(quickFiltersContainer, "PLANNING:");
  appendQuickFilterButton(quickFiltersContainer, "Ready to Estimate", "Custom filters" , "Ready to Estimate");
  appendQuickFilterButton(quickFiltersContainer, "Not Ready", "Custom filters" , "Not Ready to Estimate");
  appendQuickFilterButton(quickFiltersContainer, "Needs Info", "Custom filters" , "Needs Info");
  appendQuickFilterButton(quickFiltersContainer, "Ready to Work", "Custom filters" , "Ready to Work");
  appendQuickFilterButton(quickFiltersContainer, "Not Done", "Custom filters" , "Not Done");
  
  appendQuickFilterLabel(quickFiltersContainer, "TESTER:");
  appendQuickFilterButton(quickFiltersContainer, "Chris", "Custom filters" , "Tester is Chris");
  appendQuickFilterButton(quickFiltersContainer, "Edward", "Custom filters" , "Tester is Edward");
  appendQuickFilterButton(quickFiltersContainer, "Eric", "Custom filters" , "Tester is Eric");
  appendQuickFilterButton(quickFiltersContainer, "Gus", "Custom filters" , "Tester is Gus");
  appendQuickFilterButton(quickFiltersContainer, "Melissa", "Custom filters" , "Tester is Melissa");
  appendQuickFilterButton(quickFiltersContainer, "Nick", "Custom filters" , "Tester is Nick");
  appendQuickFilterButton(quickFiltersContainer, "PJ", "Custom filters" , "Tester is PJ");
  appendQuickFilterButton(quickFiltersContainer, "None", "Custom filters" , "No Tester");

  appendQuickFilterLabel(quickFiltersContainer, "MISC:");
  appendQuickFilterButton(quickFiltersContainer, "Flagged", "Custom filters" , "Flagged");
  
  quickFilterWrapper.appendChild(quickFiltersContainer);

  // Add the quick filters to the DOM
  quickFiltersSibling.insertAdjacentElement(`beforebegin`, quickFilterWrapper);

  // Sync the quick filter button states with the corresponding filter menu item states
  syncQuickFilters();
}


export const handleQuickFiltersMutation = (mutation) => {
  handleFiltersCleared(mutation);
  handleFilterMenuClosed(mutation);
}

const describeNode = (node) => {
  console.log(`  jce: handleFiltersCleared Node: ${node.nodeName} ${node.nodeType}`);
  if(node.attributes) {
    for (const attr of node.attributes) {
      console.log(`    jce: handleFiltersCleared Attr:  ${attr.name}=${attr.value}`);
    }
  }
}

/**
 * Handle no active filter menu items. We don't have to check each filter menu 
 * in this case and just set all quick filter buttons to inactive.
 * 
 * @param {*} mutation 
 */
const handleFiltersCleared = (mutation) => {
  
  const removedNodes = mutation.removedNodes;
  
  // Iterate over removed nodes
  if(removedNodes.length) { 
    removedNodes.forEach(
      node => {
        if(node.nodeType === 1) {

          // See if a filter menu badge element has been removed. Badges are the little number pills
          // next to the filter menu button that indicate how many filter items in that filter are active. 
          // If none are active, then the badge is removed.
          const filtersBadge = node.closest(`[data-testid$="filter-badge"]`);

          // If a filter badge has been removed...
          if(filtersBadge) {
            // Get the "Clear Filter" button
            const clearFiltersButton = document.querySelector(`[data-testid="filters.ui.filters.clear-button.ak-button"]`);

            // Determine if the button is hidden
            const hidden = clearFiltersButton.parentElement.getAttribute("aria-hidden");
            
            // If the button is hidden at this point, this indicates that no filters are active
            if(hidden) {
              deactivateAllQuickFilterButtons();
            }
          }
          
        }
      }
    );
    
  }
}

/**
 * Handles when a manually opened filter menu is closed. When this occurs,
 * we sync the quick filters so the corresponding quick filter button states
 * match the state of the filter menus
 * 
 * @param {*} mutation 
 */
const  handleFilterMenuClosed = (mutation) => {
  const removedNodes = mutation.removedNodes;
  // Iterate over removed nodes
  if(removedNodes.length) { 
    removedNodes.forEach(
      node => {
        if(node.nodeType === 1) {
          console.log(`handleFilterMenuClosed 1`);
          // See if this removed node is a manually opened drop down menu
          //const manuallyOpenedDropDownMenu = node.querySelector(`[id$="-popup-select"]:not([automated])`);          
          const manuallyOpenedDropDownMenu = node.closest(`[id$="-popup-select"]:not([automated])`);          
          console.log(`handleFilterMenuClosed 2`);
          // If a manually opened drop down menu was removed, then sync the quick filters with the menu 
          if(manuallyOpenedDropDownMenu) {
            console.log(`handleFilterMenuClosed 3`);
            syncQuickFilters();
          }
        }
      }
    );
    
  }
}

/**
 * Appends a quick filter label to the collection of quick filters 
 * 
 * @param {*} quickFiltersContainer 
 * @param {*} displayName 
 */
const appendQuickFilterLabel = (quickFiltersContainer, displayName) => {
  const quickFilterLabel = document.createElement("dd");
  quickFilterLabel.setAttribute("class", `quick-filter-label`);
  quickFilterLabel.textContent = displayName;

  quickFiltersContainer.appendChild(quickFilterLabel);
}

/**
 * Appends a quick filter button to the collection of quick filters.
 * Quick filter buttons are short cuts for filter menu items.
 * 
 * @param {*} quickFiltersContainer 
 * @param {*} displayName 
 * @param {*} filterMenuName 
 * @param {*} filterMenuItemName 
 */
const appendQuickFilterButton = (quickFiltersContainer, displayName, filterMenuName, filterMenuItemName) => {

  const quickFilterButtonContainer = document.createElement("dd");
  quickFilterButtonContainer.setAttribute("class", `quick-filter-button-container`);  

  const quickFilterButton = document.createElement("a");
  quickFilterButton.setAttribute("class", `quick-filter-button`);  
  quickFilterButton.setAttribute("filter-menu", filterMenuName);  
  quickFilterButton.setAttribute("filter-menu-item", filterMenuItemName);  
  quickFilterButton.textContent = displayName;

  quickFilterButton.addEventListener("click", getFilterMenuToggler(filterMenuName, filterMenuItemName));
  quickFilterButtonContainer.appendChild(quickFilterButton);

  quickFiltersContainer.appendChild(quickFilterButtonContainer);

  // Add the button to the quickFiltersButtonMap.
  var menuItemsMap = quickFiltersButtonMap.get(filterMenuName);
  
  if(!menuItemsMap) {
   menuItemsMap = new Map(); 
   quickFiltersButtonMap.set(filterMenuName, menuItemsMap);
  }
  menuItemsMap.set(filterMenuItemName, quickFilterButton);
}


/**
 * Sets the quick filter button style to appear active
 * 
 * @param {*} quickFilterButton 
 */
const activateQuickFilterButton = (quickFilterButton) => {
  quickFilterButton.classList.add("quick-filter-button-active");
}

/**
 * Sets the quick filter button style to appear inactive
 * 
 * @param {*} quickFilterButton 
 */
const deactivateQuickFilterButton = (quickFilterButton) => {
  quickFilterButton.classList.remove("quick-filter-button-active");
  
}
/**
 * Gets the DOM element that wraps the quick filters collection
 * 
 * @returns 
 */
const getQuickFiltersWrapper = () => {
  return document.querySelector(`[id="${QUICK_FILTERS_WRAPPER_ID}"]`);
}

/**
 * Returns a function that toggles the specified filter menu item
 * 
 * @param {*} filterMenuName 
 * @param {*} filterMenuItemName 
 * @returns 
 */
const getFilterMenuToggler = (filterMenuName, filterMenuItemName) => {
  return (e) => {
    toggleFilterMenuItem(filterMenuName, filterMenuItemName);
  }
}

/**
 * Toggles the specified filter menu item
 * 
 * @param {*} filterMenuName 
 * @param {*} filterMenuItemName 
 */
const toggleFilterMenuItem = async (filterMenuName, filterMenuItemName) => {
 
  // Open the filter menu
  await openFilterMenu(filterMenuName);
 
  // Click the specified menu item
  await clickFilterMenuItem(filterMenuItemName);

  // Close the filter menu
   await closeFilterMenus();

  // Sync the quick filters with the filter menu items state
  syncQuickFilters();
}

/**
 * Opens the specified filter menu
 * 
 * @param {*} filterMenuName 
 */
const openFilterMenu = async (filterMenuName) => {

  // Click the button that opens the filter menu
  clickFilterMenuButton(filterMenuName)

  // Wait for the corresponding menu to exist
  const dropDownMenu =(await waitForElementToExist(`[id$="-popup-select"]`));

  // Set an attribute on the menu flagging it as having been opened via an automated process.
  // This is so the filter menu closed handler can distinguish between menus that have been opened
  // via automation and manually

  dropDownMenu.setAttribute("automated", "true");;
}


/**
 * Close any open filter menus
 */
const closeFilterMenu = async (filterMenuName) => {
  // Just click away to close any open menus
  document.body.click();

  await waitForElementToExist(`button[aria-expanded="false"] [data-testid="filters.common.ui.list.${filterMenuName.replace(/\s+/g, '-').toLowerCase()}-filter"]`);
}


/**
 * Close any open filter menus
 */
const closeFilterMenus = () => {
    // Just click away to close any open menus
    document.body.click();
}

/**
 * Click the specified filter menu button
 * 
 * @param {*} filterMenuName 
 */
const clickFilterMenuButton = async (filterMenuName) => {
  // Get all the filter menu items
  const filterMenuButtons = document.querySelectorAll(`[data-testid="software-filters.ui.list-filter-container"] button`);

  // Iterate through the buttons to find the one with the specified name
  for (var i = 0; i < filterMenuButtons.length; ++i) {
    // If the button is found...
    if(filterMenuButtons[i].textContent.startsWith(filterMenuName)) {
      // Click it!
      filterMenuButtons[i].click();
      break;
    }
  }
}


/**
 * Click the specified filter menu item
 * 
 * @param {*} filterMenuItemName 
 */
const clickFilterMenuItem = async (filterMenuItemName) => {
  // Get the open menu
  // NOTE: This assumes the filter menu button has been clicked and the menu will exist. Could add some error handling/time out here
  const filterMenu = (await waitForElementToExist(`div [id$="-popup-select"]`));   
  
  // Get the list of menu item elements                  
  const filterMenuItemEls = filterMenu.querySelectorAll(`[id^="react-select-"]`);
  
  // Iterate over the menu item elements
  for (var i = 0; i < filterMenuItemEls.length; ++i) {    

    // If this is the matching menu item...
    if(filterMenuItemName === filterMenuItemEls[i].textContent) {
      // Click it! This will toggle the filter menu item state
      filterMenuItemEls[i].click();
    }

  }
}

/**
 * Waits for the specified DOM element to exist
 * 
 * @param {*} selector 
 * @returns 
 */
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

// The quick filetr button styles
const quickFilterButtonStyleRules =`
.quick-wrapper{
  display: inline-block;
  margin: 0px;
}

.quick-filters-container{
  display: inline-block;
  padding: 0px 0px 0px 0px;
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
  text-decoration: none;
}
.quick-filter-button:hover{
  border: 1px solid lightgray;
  border-radius: 15px 15px 15px 15px;
  display: inline-block;
  padding: 6px 9x;
  text-decoration: none;
}
.quick-filter-button-active{
  background-color:white;
  filter: drop-shadow(2px 4px 6px blue);
  border-radius: 15px 15px 15px 15px;
  display: inline-block;
  padding: 6px 9px;
  text-decoration: none;
}
`;

/**
 * Applies the style rules by creating a <style> element with 
 * rules and adding it to the document
 * 
 * @param {*} styleRules 
 */
const applyStyleRules = (styleRules) => {
  const sheet = document.createElement('style')
  sheet.innerHTML = styleRules;
  document.body.appendChild(sheet);
}