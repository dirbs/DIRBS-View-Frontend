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


import React, {PureComponent} from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Surface, Symbols
} from 'recharts';
import { Card, CardHeader, CardBody } from "reactstrap";
import CardLoading from "../../Loaders/CardLoading";
import { formatXAxisDate, yAxisFormatterNoDecimal, formatXAxisDateDaily, formatXAxisDateYearly, numberWithCommas } from "../../../utilities/helpers";
import { Scrollbars } from 'react-custom-scrollbars';
import randomColor  from 'randomcolor';
import InfoModel from './../../Tooltips/InfoTooltip';
import domtoimage from 'dom-to-image';

class Areachart extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      infoTooltipState: false,
      infoButtonColor: '',
      downloadImgLoading: false
    };
    this.toggleInfo = this.toggleInfo.bind(this);
  }

  toggleInfo() {
    this.setState(prevState => ({
      infoTooltipState: !prevState.infoTooltipState,
      infoButtonColor: !prevState.infoButtonColor ? "#00C5CD" : ''
    }));
  }

  filter = (node) => {
    return (node.tagName !== 'I');
  }

  generateImg = (event, title) => {
    let th = this;
    th.setState({downloadImgLoading: true});
    let target = event.target;
    let downloadImgEl = target.parentElement.parentElement;

    domtoimage.toPng(downloadImgEl, {filter: this.filter}).then(function(blob) {
      if(blob != null) {
        window.saveAs(blob, title);
        th.setState({downloadImgLoading: false});
      } 
    })
  }

  scrollableLegend = (props) => {
    const { payload } = props
    return (
      <Scrollbars
        autoHeight
        autoHeightMax={47}
      >
        <ul className="recharts-default-legend">
          {
            payload.map((entry, index) => {
              const { dataKey, color } = entry
              return (
                <li className="legend-item" key={index}>
                  <Surface width={10} height={10} viewbox="0 0 10 10">
                    <Symbols cx={6} cy={6} type="diamond" size={50} fill={color} />
                  </Surface>
                  <span>{dataKey}</span>
                </li>
              );
            })
          }
        </ul>
      </Scrollbars>
    );
  }

  render(){
  const { title, loading, data, xAxis, yAxes, chartMargin, legendIconType, legendLayout, legendAlign, legendVerticalAlign, customName, colorArray, granularity, yAxisLabel, yAxisLabelAngel, yAxisLabelPosition, info, cardClass, yAxesLabelStyle, showLegend, isShowHeader, ignoreYaxis, yAxisLabelWidth, dotProp, removeChart, chartGridId, heightProp } = this.props;
  let xAxisFormat = granularity==="daily" ? formatXAxisDateDaily : granularity==="yearly" ? formatXAxisDateYearly : formatXAxisDate ;
  let toolTipId = "";
  if(info)
  {
    toolTipId =`infoTooltipAreaChart_${info.Explanation.replace(/[^a-zA-Z0-9]/g, "")}`;
  }
  let isYaxis = false;
  return (
    <Card className={`${cardClass} card-chart`}>
      {isShowHeader && 
        <CardHeader className="border-bottom-0">
          {title}
          {info &&
            <React.Fragment>
              <i className={this.state.downloadImgLoading ? 'fa fa-circle-o-notch fa-spin fa-fw' : 'fa fa-cloud-download'} onClick={(e) => this.generateImg(e, title)}></i>
              <i className="fa fa-trash-o" onClick={() => {removeChart(chartGridId)}}></i>
              <i className="fa fa-info-circle" style={{color: this.state.infoButtonColor}} id={toolTipId} aria-hidden="true" onClick={this.toggleInfo}>
                <InfoModel TooltipState={this.state.infoTooltipState} toggle={this.toggleInfo} chartInfo={info} id={toolTipId}/>
              </i>
            </React.Fragment>
          }
        </CardHeader>
      }
      <CardBody className="steps-loading min-hei100">
        {loading ? <CardLoading /> : null}
        {((data || {}).length > 0) ? (
           <div className={heightProp === '100%' ? 'chart-box': undefined}>
            <ResponsiveContainer width="100%" height={heightProp}>
              <AreaChart
                data={data}
                margin={chartMargin}
              >
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey={xAxis} tickFormatter={xAxisFormat} style={{fontSize: "11px", fontWeight: "600"}}/>
                <YAxis width={yAxisLabelWidth} label={{ value: yAxisLabel, angle: yAxisLabelAngel, position: yAxisLabelPosition, style: yAxesLabelStyle }} tickFormatter={yAxisFormatterNoDecimal} style={{fontSize: "11px", fontWeight: "600"}}/>
                <Tooltip labelFormatter={xAxisFormat} contentStyle={{borderRadius: '0.5rem', border: '#0093c9 1px solid', borderTopWidth: '4px', padding: '0'}} formatter={(value, name) => [numberWithCommas(value) , name]}/>
                { !showLegend ? null
                  :
                <Legend 
                  content={this.scrollableLegend} 
                  iconType={legendIconType} 
                  layout={legendLayout} 
                  verticalAlign={legendVerticalAlign} 
                  align={legendAlign} 
                />
                }
                {yAxes.map((value, i) => {
                  if (value === ignoreYaxis) {
                    isYaxis = true;
                    return null;
                  }
                  return (
                    <Area opacity="1" name={customName} type="monotone" dataKey={value} key={i} stroke={isYaxis ? colorArray[i - 1] : colorArray[i]} animationDuration={3000} fill={isYaxis ? colorArray[i - 1] : colorArray[i]} strokeWidth={1} dot={dotProp}/>
                  );
                })} 
              </AreaChart>
            </ResponsiveContainer>
            </div>
        ) : (
          "No Data Exists"
        )}
      </CardBody>
    </Card>
  );
};
}

Areachart.defaultProps ={
    chartMargin: { top: 5, right: 0, left: 0, bottom: 5,  }, /* Changes margin of chart inside the card */
    legendIconType:'diamond' /*  'line' | 'rect'| 'circle' | 'cross' | 'diamond' | 'square' | 'star' | 'triangle' | 'wye' | 'none' */,
    cGrid: "3 3", /* changes the cartesian Grid of the chart */
    barSize: 70, /* changes the size of the bar */
    legendLayout:'horizontal', /* 'verticle' */
    legendAlign:'center', /* 'left', 'center', 'right' */
    legendVerticalAlign:'bottom', /* 'top', 'middle', 'bottom' */
    colorArray: randomColor({luminosity: 'bright', count: 100}), /* luminosity: 'dark', 'light' */
    yAxisLabelAngel: -90, /* -90, 90' */
    yAxisLabelPosition: 'insideLeft', /* 'insideLeft', 'insideRight' */
    yAxesLabelStyle: { textAnchor: 'middle', fontSize: '11px', fontWeight: '500' },
    showLegend: true, /* boolean to show or hide legends */
    isShowHeader: true, /* boolean to show or hide card header */
    ignoreYaxis: 'x_axis', /* to ignore x_axis key from y axis */
    dotProp : false, /* { stroke: '#8a2be2', strokeWidth: 0.5 } */
    heightProp: '100%'
}

export default Areachart;

