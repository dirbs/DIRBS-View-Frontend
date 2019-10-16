/*
Copyright (c) 2018-2019 Qualcomm Technologies, Inc.
All rights reserved.
Redistribution and use in source and binary forms, with or without modification, are permitted (subject to the limitations in the 
disclaimer below) provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer 
      in the documentation and/or other materials provided with the distribution.
    * Neither the name of Qualcomm Technologies, Inc. nor the names of its contributors may be used to endorse or promote 
      products derived from this software without specific prior written permission.
    * The origin of this software must not be misrepresented; you must not claim that you wrote the original software. If you use 
      this software in a product, an acknowledgment is required by displaying the trademark/log as per the details provided 
      here: https://www.qualcomm.com/documents/dirbs-logo-and-brand-guidelines
    * Altered source versions must be plainly marked as such, and must not be misrepresented as being the original software.
    * This notice may not be removed or altered from any source distribution.
NO EXPRESS OR IMPLIED LICENSES TO ANY PARTY'S PATENT RIGHTS ARE GRANTED BY THIS LICENSE. THIS SOFTWARE IS PROVIDED 
BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT 
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO 
EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, 
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; 
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS 
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


import React, { PureComponent } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Surface, Symbols
} from 'recharts';
import {Card, CardHeader, CardBody} from 'reactstrap';
import CardLoading from '../../Loaders/CardLoading';
import { formatXAxisDate, yAxisFormatter, formatXAxisDateDaily, formatXAxisDateYearly} from './../../../utilities/helpers';
import { Scrollbars } from 'react-custom-scrollbars';
import { OverlayTrigger, Popover } from "react-bootstrap";

/**
 * This bar chart recieve props to be reusable according to the need
 */

class BarchartCopy extends PureComponent {

  constructor(props) {
    super(props)
    this.state = {
      data: [],
      active: ""
    }
  }

  handleClick = (e) => {
    const dataKey = e.target.innerText
    this.setState({ active: dataKey })
  }

  renderPopoverTop = (dataKey) => {
    const datakeyString = dataKey.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
    return (
      <Popover id="legend">
        <div className="toolTip">
          <div className="tooltip-layout" />
          <div className="label">{dataKey}</div>
        </div>
      </Popover>
    )
  }

  scrollableLegend = (props) => {
    const { payload } = props
    return (
      <Scrollbars
        style={{
          position: 'relative'
        }}
        autoHeight
        autoHeightMax={360}
      >
        <ul className="recharts-default-legend legend-verticle">
          {
            payload.map((entry, index) => {
              const { dataKey, color } = entry
              let style = {}
              if (dataKey == this.state.active) {
                style = { backgroundColor: color , color: '#fff'}
              }
              return (
                <OverlayTrigger
                  onClick={this.handleClick}
                  key={`overlay-${dataKey}`}
                  trigger={["hover", "focus"]}
                  placement="top"
                  overlay={this.renderPopoverTop(dataKey)}
                  container={ this.refs.dest }
                >
                  <li className="legend-item" onClick={this.handleClick} style={style}>
                    <Surface width={10} height={10} viewbox="0 0 10 10" onClick={this.handleClick}>
                      <Symbols cx={6} cy={6} type="circle" size={50} fill={color} onClick={this.handleClick} />
                    </Surface>
                    <span onClick={this.handleClick}>{dataKey}</span>
                  </li>
                </OverlayTrigger>
              );
            })
          }
        </ul>
      </Scrollbars>
    );
  }

  render() {
    const {title, loading, data, xAxis, yAxes, chartMargin, legendLayout, legendIconType, legendVerticalAlign, customName, legendAlign, cGrid, legendStyle, barSize, colorArray, granularity} = this.props;
    let xAxisFormat = granularity==="daily" ? formatXAxisDateDaily : granularity==="yearly" ? formatXAxisDateYearly : formatXAxisDate ;
    return (
      <Card className="card-chart">
          <CardHeader className="border-bottom-0">
              {title}
          </CardHeader>
          <CardBody className='steps-loading min-hei100'>
            {loading ? <CardLoading /> : null}
            {((data || {}).length > 0) ?
            <div className="chart-box">
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={data}
                  margin={chartMargin}
                >
                  <CartesianGrid strokeDasharray={cGrid}/>
                  <XAxis dataKey={xAxis} tickFormatter={xAxisFormat} style={{fontSize: "12px", fontWeight: "bold"}}/>
                  <YAxis tickFormatter={yAxisFormatter} style={{fontSize: "12px", fontWeight: "bold"}} type="number" domain={['dataMin', 'dataMax + 1000']}/>
                  <Tooltip  labelFormatter={xAxisFormat}/>
                  <Legend 
                    iconType={legendIconType}
                    layout={legendLayout} verticalAlign={legendVerticalAlign} align={legendAlign}
                    wrapperStyle={legendStyle}
                    onClick={this.handleClick} 
                    content={this.props.legendLayout == "vertical" ? this.scrollableLegend : null} 
                  />
                  
                  {yAxes.map((model, i) => {
                    if(model === 'x_axis') {
                      return null;
                    }
                    return  yAxes.length > 3 ? <Bar name={customName} key={i} barSize={barSize} dataKey={model} stackId="a" fill={colorArray[i]}  /> : <Bar name={customName} key={i} barSize={barSize} dataKey={model} fill={colorArray[i]} />
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
              : 'No Data Exists'}
          </CardBody>
      </Card>
    );
  }
}

export default BarchartCopy;

BarchartCopy.defaultProps = {
  chartMargin: { top: 5, right: 0, left: 0, bottom: 5,  }, /* Changes margin of chart inside the card */
  legendIconType:'line' /*  'line' | 'rect'| 'circle' | 'cross' | 'diamond' | 'square' | 'star' | 'triangle' | 'wye' | 'none' */,
  cGrid: "3 3", /* changes the cartesian Grid of the chart */
  barSize: 70, /* changes the size of the bar */
  legendLayout:'horizontal', /* 'verticle' */
  legendAlign:'center', /* 'left', 'center', 'right' */
  legendVerticalAlign:'bottom', /* 'top', 'middle', 'bottom' */
}