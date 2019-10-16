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
import { Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Label, Surface, Symbols } from 'recharts';
import CardLoading from '../../Loaders/CardLoading';
import randomColor from "randomcolor";
import { Scrollbars } from 'react-custom-scrollbars';
import {numberWithCommas} from '../../../utilities/helpers';
let dataArray = [];

/**
* Chart for Top Devices Importer
*/
class Piechart extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      pieElHeight: null
    };
  }

  componentDidMount() {
    let pieElHeight = this.divElement;
    if(pieElHeight) {
      pieElHeight = this.divElement.clientHeight;
      this.setState({ pieElHeight });
    }
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    let pieElHeight = this.divElement;
    if(pieElHeight) {
      pieElHeight = this.divElement.clientHeight;
      this.setState({ pieElHeight });
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resize.bind(this));
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
              const { value, color } = entry
              return (
                <li className="legend-item">
                  <Surface width={10} height={10} viewbox="0 0 10 10">
                    <Symbols cx={6} cy={6} type="rect" size={50} fill={color} />
                  </Surface>
                  <span>{value}</span>
                </li>
              );
            })
          }
        </ul>
      </Scrollbars>
    );
  }

  formateData = (dataToFormate) => {
      dataArray = [];
      dataToFormate.map(obj => 
      dataArray.push({ 'name': Object.keys(obj)[0], 'value': obj[Object.keys(obj)[0]] })
    );
  }

  renderCustomizedLabel({
    cx, cy, midAngle, innerRadius, outerRadius,percent, value, color, startAngle, endAngle}) {
    let y;
    let x;
    const RADIAN = Math.PI / 180;
    const diffAngle = endAngle - startAngle;
    const delta = ((360-diffAngle)/30);
    const radius = innerRadius + (outerRadius - innerRadius);
    if ( (midAngle >= 0 && midAngle <= 30) || (midAngle >= 330 && midAngle <= 360) || (midAngle >= 150 && midAngle <= 210)  )
    {
    x = cx + (radius + delta * delta * 0.5) * Math.cos(-midAngle * RADIAN);
    y = cy + (radius + delta * 15) * Math.sin(-midAngle * RADIAN);
    }
    else
    {
       x = cx + (radius + delta * delta * 0.5) * Math.cos(-midAngle * RADIAN);
       y = cy + (radius + delta * 3) * Math.sin(-midAngle * RADIAN);
    }
    return (
      <text x={x} y={y} fill="black" textAnchor={x > cx ? 'start' : 'end'} 	dominantBaseline="central">
        {`${(percent * 100).toFixed(2)}%`}
      </text>
    );
  };

  renderCustomizedLabelLine(props){
    let { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle } = props;
    const RADIAN = Math.PI / 180;
    const diffAngle = endAngle - startAngle;
    const radius = innerRadius + (outerRadius - innerRadius);
    let path='';
    if ( (midAngle >= 0 && midAngle <= 30) || (midAngle >= 330 && midAngle <= 360) || (midAngle >= 150 && midAngle <= 210)  )
    {
    for(let i=0;i<((360-diffAngle)/30);i++){
      path += `${(cx + (radius + i * i * 0.5) * Math.cos(-midAngle * RADIAN ))},${(cy + (radius + i * 15) * Math.sin(-midAngle * RADIAN))} `
    }
  }
  else
  {
    for(let i=0;i<((360-diffAngle)/30);i++){
      path += `${(cx + (radius + i * i * 0.5) * Math.cos(-midAngle * RADIAN ))},${(cy + (radius + i * 3) * Math.sin(-midAngle * RADIAN))} `
    }
  }

    return (
      <polyline points={path} stroke={"#800080"} fill="none" />
    );
  }

  render() {
    const { loading, data, value, colorArray, innerRadiusProp, paddingProp, legendIconType, legendLayout, legendAlign, legendVerticalAlign, showLegend, isShowLable } = this.props;
    return (
      <div className="pie-box" ref={ (divElement) => this.divElement = divElement} style={{ position: 'relative', width: '100%', paddingTop: '100%' }}>
        {loading ? <CardLoading /> : null}
        {((data || {}).length > 0) ?
          <React.Fragment>
            {this.formateData(data)}
            <ResponsiveContainer width='100%' height={this.state.pieElHeight}>
              <PieChart 
                label={true}
              > 
                 <Tooltip labelStyle={{fontWeight: "bold"}} contentStyle={{borderRadius: '0.5rem', border: '#0093c9 1px solid', borderTopWidth: '4px', padding: '0' }} formatter={(value, name) => [numberWithCommas(value) , name]}/>
                 <Label value="any" color="#fff"/>
                 { showLegend && 
                <Legend 
                  content={this.scrollableLegend}
                  iconType={legendIconType}
                  layout={legendLayout} 
                  verticalAlign={legendVerticalAlign} 
                  align={legendAlign}
                />
                 }
                <Pie stroke="none" dataKey={value} isAnimationActive={true} data={dataArray} labelLine={isShowLable && this.renderCustomizedLabelLine} label={isShowLable && this.renderCustomizedLabel} animationDuration={3000} outerRadius='100%' fill="#8884d8" innerRadius={innerRadiusProp} paddingAngle={paddingProp}>
                  {
                    dataArray.map((entry, index) => <Cell key={index} fill={colorArray[index]} />)
                  }
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </React.Fragment>
        : 'No Data Exists'}
      </div>
    )
  }
}

Piechart.defaultProps ={
  legendIconType:'triangle' /*  'line' | 'rect'| 'circle' | 'cross' | 'diamond' | 'square' | 'star' | 'triangle' | 'wye' | 'none' */,
  legendLayout:'horizontal', /* 'verticle' */
  legendAlign:'center', /* 'left', 'center', 'right' */
  legendVerticalAlign:'bottom', /* 'top', 'middle', 'bottom' */
  colorArray: randomColor({luminosity: 'bright', count: 100}), /* luminosity: 'dark', 'light' */
  innerRadiusProp: 0, /* Integer */
  paddingProp: 0, /* Integer */
  showLegend: true, /* boolean to show or hide Legends */
  isShowHeader: true, /* boolean to show or hide card header */
  isShowLable: true /* boolean to show or hide PieChart Label */
}

export default Piechart;