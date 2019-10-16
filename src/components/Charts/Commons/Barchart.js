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
import { formatXAxisDate, yAxisFormatter, formatXAxisDateDaily, formatXAxisDateYearly, numberWithCommas} from './../../../utilities/helpers';
import { Scrollbars } from 'react-custom-scrollbars';
import InfoModel from './../../Tooltips/InfoTooltip';
import domtoimage from 'dom-to-image';
/**
 * This bar chart recieve props to be reusable according to the need
 */

class Barchart extends PureComponent {
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
    title = title.props ? title.props.children[0] : title;
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
                    <Symbols cx={6} cy={6} type="circle" size={50} fill={color} />
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

  render() {
    const {title, loading, data, xAxis, yAxes, chartMargin, legendLayout, legendIconType, legendVerticalAlign, customName, legendAlign, cGrid, legendStyle, barSize, colorArray, granularity, yAxisLabel, yAxisLabelAngel, yAxisLabelPosition, yAxesLabelStyle, info, cardClass, showLegend, removeChart, chartGridId, heightProp } = this.props;
    let xAxisFormat = granularity==="daily" ? formatXAxisDateDaily : granularity==="yearly" ? formatXAxisDateYearly : formatXAxisDate ;
    let toolTipId = "";
    if(info)
    {  
       toolTipId =`infoTooltipBarChart_${info.Explanation.replace(/[^a-zA-Z0-9]/g, "")}`;
    }
    return (
      <Card className={`${cardClass} card-chart`}>
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
      
          <CardBody className='steps-loading min-hei100'>
            {loading ? <CardLoading /> : null}
            {((data || {}).length > 0) ?
              <ResponsiveContainer width='100%' height={heightProp}>
                <BarChart
                  data={data}
                  margin={chartMargin}
                >
                  <CartesianGrid strokeDasharray={cGrid}/>
                  <XAxis dataKey={xAxis} tickFormatter={xAxisFormat} style={{fontSize: "11px", fontWeight: "600"}}/>
                  <YAxis label={{ value: yAxisLabel, angle: yAxisLabelAngel, position: yAxisLabelPosition, style: yAxesLabelStyle }} tickFormatter={yAxisFormatter} style={{fontSize: "11px", fontWeight: "600"}} type="number" domain={[0, dataMax => (Math.round(dataMax * 1.1))]}/>
                  <Tooltip  labelFormatter={xAxisFormat} contentStyle={{borderRadius: '0.5rem', border: '#0093c9 1px solid', borderTopWidth: '4px', padding: '0'}} formatter={(value, name) => [numberWithCommas(value) , name]}/>
                  { showLegend==="false" ? null
                  : 
                  <Legend 
                    iconType={legendIconType}
                    layout={legendLayout} verticalAlign={legendVerticalAlign} align={legendAlign}
                    wrapperStyle={legendStyle}
                    onClick={this.handleClick} 
                    content={this.scrollableLegend} 
                  />
                  }
                  {yAxes.map((model, i) => {
                    if(model === 'x_axis') {
                      return null;
                    }
                    return  yAxes.length > 3 ? <Bar name={customName} key={i} barSize={barSize} dataKey={model} animationDuration={3000} stackId="a" fill={colorArray[i]}  /> : <Bar name={customName} key={i} barSize={barSize} animationDuration={3000} dataKey={model} fill={colorArray[i]} />
                  })}
                </BarChart>
              </ResponsiveContainer>
              : 'No Data Exists'}
          </CardBody>
      </Card>
    );
  }

}

export default Barchart;

Barchart.defaultProps = {
  chartMargin: { top: 5, right: 0, left: 0, bottom: 5,  }, /* Changes margin of chart inside the card */
  legendIconType:'line' /*  'line' | 'rect'| 'circle' | 'cross' | 'diamond' | 'square' | 'star' | 'triangle' | 'wye' | 'none' */,
  cGrid: "3 3", /* changes the cartesian Grid of the chart */
  barSize: 70, /* changes the size of the bar */
  legendLayout:'horizontal', /* 'verticle' */
  legendAlign:'center', /* 'left', 'center', 'right' */
  legendVerticalAlign:'bottom', /* 'top', 'middle', 'bottom' */
  yAxisLabelAngel: -90, /* '-90', '90' */
  yAxisLabelPosition: 'insideLeft', /* 'insideLeft', 'insideRight' */
  yAxesLabelStyle: { textAnchor: 'middle', fontSize: '11px', fontWeight: '500' },
  showLegend: true,
  heightProp: '100%'
}