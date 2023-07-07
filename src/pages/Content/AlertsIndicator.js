import React from 'react';

import Tooltip from '@atlaskit/tooltip';

export default ({alerts}) => {
  var tooltipContent;

  tooltipContent = (
    <div>
      {
        alerts.map(alert => {
            var conditionaLineBreak;
            if(! alert === alerts.slice(-1)) {
              conditionaLineBreak = <br/>
            }
            return <div><div>&#x2022;{alert}</div>{conditionaLineBreak}</div>
          }
        )
      }
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      {(tooltipProps) => (
        <div {...tooltipProps}>
          <span class="css-1kdtj8v" style={{backgroundColor: "yellow"}}>
            <span class="css-1yqht91">!</span>
          </span>
        </div>
      )}
    </Tooltip>
  );
}