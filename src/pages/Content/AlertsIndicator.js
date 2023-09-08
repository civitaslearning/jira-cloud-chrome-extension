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
          <span style={{"backgroundColor":"yellow", "padding-inline":"var(--ds-space-075, 6px)", "border-radius": "var(--ds-border-radius-200, 8px)"}}>
            <span>!</span>
          </span>
        </div>
      )}
    </Tooltip>
  );
}