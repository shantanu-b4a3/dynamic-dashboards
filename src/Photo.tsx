import React, {forwardRef} from 'react';

import ReactECharts from 'echarts-for-react';
export const Photo = forwardRef(({url, index, faded, style, ...props}:any, ref) => {
  const inlineStyles = {
    opacity: faded ? '0.2' : '1',
    transformOrigin: '0 0',
    height: index === 0 ? 410 : 200,
    gridRowStart: index === 0 ? 'span 2' : null,
    gridColumnStart: index === 0 ? 'span 2' : null,
    backgroundImage: `url("${url}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: 'grey',
    ...style,
  };

      const option =     {
    'xAxis': {
        'type': 'category',
        'data': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    'yAxis': {
        'type': 'value'
    },
    series: [
            {
                'data': [150, 230, 224, 218, 135, 147, 260],
                'type': 'line'
            }
        ]
    };
  return <div ref={ref} style={inlineStyles} {...props}></div>;
});
