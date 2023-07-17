import { isBacklogView, handleBacklogViewMutation } from './backlogViewEnhancer';
import { isBoardView, handleBoardViewMutation } from './boardViewEnhancer';


console.log('jce: Content script running 8...')


/**
 * Observe mutations and update the backlog as necessary
 */
const observer = new MutationObserver(
  mutations => {  
    mutations.map(
      mutation => {

        if(isBoardView()) {
          handleBoardViewMutation(mutation);  
        }
        else if(isBacklogView()){
          handleBacklogViewMutation(mutation);  
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
/*
const dropDownMenu = document.querySelector('[class="fiolfg-1 eYRRDc css-2b74hb"]');

if(dropDownMenu) {
  console.log("jce: dropdown menu found");
  dropDownMenu.click();
  //const option = document.querySelector('[id="react-select-2-option-0"]');
  const option = document.querySelector('[data-test-id="filters.common.ui.list.menu.list"]');
  if(option) {
    console.log("jce: option found");
    option.click();
  }else {
    console.log("jce: option not found");
  }

} else {
  console.log("jce: dropdown menu not found");
}
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

/*
(async () => {
  (await waitForElementToExist('[class="fiolfg-1 eYRRDc css-2b74hb"]')).click();
  console.log('The element exists 1');
  (await waitForElementToExist('[data-test-id="filters.common.ui.list.menu.list"]')).click();
  console.log('The element exists 2');
  (await waitForElementToExist('[data-testid="software-board.header.title.container"]')).click();
  
  console.log('The element exists 3');
	//var element = 
  //element.click();
  //await waitForElementToExist('[data-test-id="filters.common.ui.list.menu.list]').click();
  
})();
*/
