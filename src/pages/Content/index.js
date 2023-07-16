import { isBacklogView, handleBacklogViewMutation } from './backlogViewEnhancer';
import { isBoardView, handleBoardViewMutation } from './boardViewEnhancer';


console.log('jce: Content script running 5...')


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