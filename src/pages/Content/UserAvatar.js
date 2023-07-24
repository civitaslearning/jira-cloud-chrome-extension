import React from 'react';

import Tooltip from '@atlaskit/tooltip';

export default ({fieldDisplayName, userData}) => {
  return (
    

    <Tooltip content={`${fieldDisplayName}: ${userData?userData.displayName:'None'}`}>

      {
        userData?
          (
            <span style={{'margin':'var(--ds-space-025, 2px)', 'display':'flex', 'height':'24px', 'width':'24px'}}> 
              <img src={userData.avatarUrls["24x24"]}  style={{borderRadius:"50%"}}/>
            </span>
          )
        :(
          (tooltipProps) => (
            <div {...tooltipProps}>
              <span 
                style={{'margin':'var(--ds-space-025, 2px)','overflow':'hidden','display':'flex','border-radius':'50%', 'height':'24px', 'width':'24px'}}
                data-testid="issue-field-assignee.common.ui.read-view.popover.avatar--inner"
                >
                <span style={{'background-color':'var(--ds-icon-subtle, #8993A4)','display':'block', 'height':'100%', 'width':'100%'}}>
                  <span 
                    data-testid="issue-field-assignee.common.ui.read-view.popover.avatar--person" 
                    role="img" aria-label="Unassigned" 
                    style={{'--icon-primary-color':'var(--ds-icon-inverse, #FFFFFF)'}}
                    >
                    <svg width="24" height="24" viewBox="0 0 24 24" role="presentation">
                      <g fill="white" fill-rule="evenodd">
                        <path d="M6 14c0-1.105.902-2 2.009-2h7.982c1.11 0 2.009.894 2.009 2.006v4.44c0 3.405-12 3.405-12 0V14z"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </g>
                    </svg>
                  </span>
                </span>
              </span>
            </div>
          )
        )
      }
    </Tooltip>
  );
}