
const QUICK_FILTERS_WRAPPER_ID = 'QUICK_FILTERS_WRAPPER_ID';


function waitForElementToNotExist(selector) {
  return new Promise(resolve => {
    if (!document.querySelector(selector)) {
      console.log(`jce: waitForElementToNotExist: ${selector}`);
      return resolve();
    }

    const observer = new MutationObserver(() => {
      if (!document.querySelector(selector)) {
        console.log(`jce: waitForElementToNotExist: ${selector}`);
        resolve();
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
    });
  });
}


export const syncQuickFilters = async () => {
  console.log("jce: syncQuickFilters ");

  await waitForElementToExist(`[data-testid="filters.common.ui.list.epic-filter"]`);
  await clickFilterMenuButton("Epic");
  await getCheckedMenuItems("Epic");
  await clickFilterMenuButton("Epic");


  await clickFilterMenuButton("Label");
  await getCheckedMenuItems("Label");
  await clickFilterMenuButton("Label");

  await clickFilterMenuButton("Custom filters");
  await getCheckedMenuItems("Custom filters");
  await clickFilterMenuButton("Custom filters");

  await clickFilterMenuButton("Type");
  await getCheckedMenuItems("Type");
  await clickFilterMenuButton("Type");
}

const getCheckedMenuItems = async (menuName) => {
  (await waitForElementToExist(`[data-test-id="filters.common.ui.list.menu.list"]`));
  const filterMenuItemEls = document.querySelectorAll(`[id^="react-select-"] > div > span[style*="selected"]`);
  console.log(`jce: getCheckedMenuItems: Found ${filterMenuItemEls.length} checked items for menu ${menuName}`);
}



export const addQuickFilters = async (quickFiltersSibling) => {
  
  console.log(`jce: addQuickFilters: ${quickFiltersSibling}`)
  if( getQuickFiltersWrapper() ) {
    return;
  }

  applyStyleRules(quickFilterButtonStyleRules);

  //const quickFiltersSibling = document.querySelector('[data-test-id="software-board.header.controls-bar"]').parentElement.parentElement;

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
  appendQuickFilterButton(quickFiltersContainer, "Chris", "Custom filters" , "Owned By Chris");
  appendQuickFilterButton(quickFiltersContainer, "Eric", "Custom filters" , "Owned By Eric");
  appendQuickFilterButton(quickFiltersContainer, "Gus", "Custom filters" , "Owned By Gus");
  appendQuickFilterButton(quickFiltersContainer, "Kei", "Custom filters" , "Owned By Kei");
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
  
  appendQuickFilterLabel(quickFiltersContainer, "TESTER:");
  appendQuickFilterButton(quickFiltersContainer, "Chris", "Custom filters" , "Tester is Chris");
  appendQuickFilterButton(quickFiltersContainer, "Eric", "Custom filters" , "Tester is Eric");
  appendQuickFilterButton(quickFiltersContainer, "Gus", "Custom filters" , "Tester is Gus");
  appendQuickFilterButton(quickFiltersContainer, "Kei", "Custom filters" , "Tester is Kei");
  appendQuickFilterButton(quickFiltersContainer, "Nick", "Custom filters" , "Tester is Nick");
  appendQuickFilterButton(quickFiltersContainer, "PJ", "Custom filters" , "Tester is PJ");
  appendQuickFilterButton(quickFiltersContainer, "None", "Custom filters" , "No Tester");
  
  quickFilterWrapper.appendChild(quickFiltersContainer);

  quickFiltersSibling.insertAdjacentElement(`beforebegin`, quickFilterWrapper);

  // syncQuickFilters();
}

const handleFilterMenuClosed = (mutation) => {
  console.log(`jce: handleFilterMenuClosed`);

  // If an <INPUT> element has been removed from the backlog issue editor, this implies that the user has
  // finished editing an attribute of the issue. NOTE: This *doesn't* imply that the user actually made a change, 
  // but for now we just unconditionally update the corrresponding issue card
  const removedNodes = mutation.removedNodes;
  if(removedNodes.length) { 
    removedNodes.forEach(
      node => {
        console.log(`jce: handleFilterMenuClosed 2`);
      
        if(node.nodeType === 1) {
          const menuItemItems = node.querySelectorAll(`[data-test-id="filters.common.ui.list.menu.list"]`);

          console.log(`jce: handleFilterMenuClosed 3`);

          menuItemItems.forEach(
            menuItem => {
              console.log(`jce: handleFilterMenuClosed removed menu item`);
            } 
          );
        }
        
        /*menuItemItems.forEach(
          menuItem => {
            console.log(`jce: handleFilterMenuClosed removed menu item`);
          } 
        );
        */
      }
    );
    
  }
}

const handleFilterMenuOpen = (mutation) => {
  console.log(`jce: handleFilterMenuOpen`);

  // If an <INPUT> element has been removed from the backlog issue editor, this implies that the user has
  // finished editing an attribute of the issue. NOTE: This *doesn't* imply that the user actually made a change, 
  // but for now we just unconditionally update the corrresponding issue card
  const addedNodes = mutation.addedNodes;
  if(addedNodes.length) { 
    addedNodes.forEach(
      node => {
        console.log(`jce: handleFilterMenuOpen 2`);
      
        if(node.nodeType === 1) {
          const menuItemItems = node.querySelectorAll(`[data-test-id="filters.common.ui.list.menu.list"]`);

          console.log(`jce: handleFilterMenuOpen 3`);

          menuItemItems.forEach(
            menuItem => {
              console.log(`jce: handleFilterMenuOpen added menu item`);
            } 
          );
        }
        
        /*menuItemItems.forEach(
          menuItem => {
            console.log(`jce: handleFilterMenuClosed removed menu item`);
          } 
        );
        */
      }
    );
    
  }
}

const appendQuickFilterLabel = (quickFiltersContainer, displayName) => {
  const quickFilterLabel = document.createElement("dd");
  quickFilterLabel.setAttribute("class", `quick-filter-label`);
  quickFilterLabel.textContent = displayName;

  quickFiltersContainer.appendChild(quickFilterLabel);
}

const appendQuickFilterButton = (quickFiltersContainer, displayName, filterMenuName, filterMenuItemName) => {
  const quickFilterButtonContainer = document.createElement("dd");
  quickFilterButtonContainer.setAttribute("class", `quick-filter-button-container`);  

  const quickFilterButton = document.createElement("a");
  quickFilterButton.setAttribute("class", `quick-filter-button`);  
  quickFilterButton.textContent = displayName;

  quickFilterButton.addEventListener("click", getFilterMenuToggler(filterMenuName, filterMenuItemName));
  quickFilterButtonContainer.appendChild(quickFilterButton);

  quickFiltersContainer.appendChild(quickFilterButtonContainer);
}

const getQuickFiltersWrapper = () => {
  return document.querySelector(`[id="${QUICK_FILTERS_WRAPPER_ID}"]`);
}

const getFilterMenuToggler = (filterMenuName, filterMenuItemName) => {
  return (e) => {
    e.target.classList.toggle("quick-filter-button-active");
    toggleFilterMenuItem(filterMenuName, filterMenuItemName);
  }
}

const toggleFilterMenuItem = async (filterMenuName, filterMenuItemName) => {
  await clickFilterMenuButton(filterMenuName);
  await clickFilterMenuItem(filterMenuItemName);
  await clickFilterMenuButton(filterMenuName);

  /*
  clickFilterMenuButton(filterMenuName); // Open the filter menu

  await clickFilterMenuItem(filterMenuItemName);

  clickFilterMenuButton(filterMenuName); // Click away to close the filter menu
  */
}

const clickFilterMenuButton = async (filterMenuName) => {
  const filterMenuButtons = document.querySelectorAll(`[data-test-id="software-filters.ui.list-filter-container"] button`);

  console.log(`jce: getFilterMenuButton: ${filterMenuName} ${filterMenuButtons.length}`);

  for (var i = 0; i < filterMenuButtons.length; ++i) {
    console.log(`jce: getFilterMenuButton: ${filterMenuButtons[i].textContent}`);
    
    if(filterMenuButtons[i].textContent.startsWith(filterMenuName)) {
      console.log(`jce: getFilterMenuButton: Found!`);
      filterMenuButtons[i].click();
      break;
    }
  }
}

const clickFilterMenuItem = async (filterMenuItemName) => {

  console.log(`jce: getFilterMenuItemButton`);

  (await waitForElementToExist(`[data-test-id="filters.common.ui.list.menu.list"]`));

  const filterMenuItemEls = document.querySelectorAll(`[data-test-id="filters.common.ui.list.menu.list"]`);
  
  console.log(`jce: getFilterMenuItemButton: ${filterMenuItemEls.length}`);

  for (var i = 0; i < filterMenuItemEls.length; ++i) {
    console.log(`jce: getFilterMenuItemButton: ${filterMenuItemEls[i].textContent}`);
    
    if(filterMenuItemName === filterMenuItemEls[i].textContent) {
      console.log(`jce: getFilterMenuItemButton: Found!`);
      
      const closest = filterMenuItemEls[i].closest(`[data-test-id="filters.common.ui.list.menu.list"]`);
      console.log(`jce: getFilterMenuItemButton: Closest: ${closest}`);
      closest.click(); 
    }
  }

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



const applyStyleRules = (styleRules) => {
  const sheet = document.createElement('style')
  sheet.innerHTML = styleRules;
  document.body.appendChild(sheet);
}