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
import moment from "moment";
import {Date_Format } from './../../utilities/constants';
import DatePicker from "react-datepicker";

export default class RenderMonthRangePicker extends PureComponent {
  constructor(props) {
      super(props);

      this.state = {
          startDate: new Date(moment().subtract(1,'month').format(Date_Format)),
          endDate: new Date(),
          isEndDateTouched: false
      };

    this.handleChangeStart = this.handleChangeStart.bind(this);
    this.handleChangeEnd = this.handleChangeEnd.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.resetDate = this.resetDate.bind(this);

  }

  componentDidMount(){
    this.setInitialDate()
  }


  //This function will update date renge according to granularity props.

  UNSAFE_componentWillReceiveProps(newProps){
    if(this.state.startDate !==  null && newProps.granularity !== this.props.granularity)
    {
    if (newProps.granularity === "monthly")
    {
      this.setState({startDate: new Date(moment(this.state.endDate).subtract(1, "month").format(Date_Format))}, () => this.handleChange());
    }
    else
    {
      this.setState({startDate: new Date(moment(this.state.endDate).subtract(1, "year").format(Date_Format))}, () => this.handleChange());
    }
    }
  }
  // In this method we are setting initial values for date picker
  setInitialDate = () =>
  {
    if(this.props.value === "")
    {
    this.setState({startDate: new Date(moment().subtract(1,'month').format(Date_Format))}, () => this.handleChange());
    this.setState({endDate: new Date()}, () => this.handleChange());
    if(!this.props.isRangerPicker)
    {
      this.props.onChange(this.props.name, moment(this.state.startDate).format('M') + ',' + moment(this.state.startDate).format('YYYY'));
    }
    else
    {
      this.props.onChange(this.props.name, moment(this.state.startDate).format(Date_Format) + ',' + moment(this.state.endDate).format(Date_Format));
    }
  }
  }

  // get calls from month picker on change
  handleChangeStart(sdate) {
    if(sdate) {
    this.setState({startDate: sdate}, () => this.handleChange());
    }
  }

  // get calls from month picker on change
  handleChangeEnd(edate) {
    if(edate) {
    this.setState({endDate: edate, isEndDateTouched: true}, () => this.handleChange());
    }
  }

  
  handleChange() {
    const {startDate, endDate, isEndDateTouched } = this.state;
    // this is going to call setFieldValue and manually update values.fieldName
    if(startDate && endDate) {
      if(!this.props.isRangerPicker)
      {
        this.props.onChange(this.props.name, moment(startDate).format('M') + ',' + moment(startDate).format('YYYY'));
      }
      else
      {
        if(isEndDateTouched)
        {
        let daysInMonth = moment(endDate).daysInMonth();
        this.props.onChange(this.props.name, moment(startDate).format(Date_Format) + ',' + moment(endDate).add(daysInMonth - 1, "day").format(Date_Format));
        }
        else{
          this.props.onChange(this.props.name, moment(startDate).format(Date_Format) + ',' + moment(endDate).format(Date_Format));
        }
      }
    } else {
        this.props.onChange(this.props.name, '');
    }
    this.handleBlur();
  }
  
  handleBlur() {
    this.props.onBlur(this.props.name, true);
  }
  
  resetDate(){
    this.setState({
      startDate: null,
      endDate: null
    })
  }

  render() {
     let isEndDate = this.props.isRangerPicker === true ? this.state.endDate : null
    return (
      <div className="field-box"><DatePicker
      selected={this.state.startDate}
      selectsStart
      startDate={this.state.startDate}
      endDate={isEndDate}
      dateFormat = "MMM-yy"
      showMonthYearPicker
      onChange={this.handleChangeStart}
      minDate={new Date(moment().subtract(10,'years').format(Date_Format))}
      maxDate={this.state.endDate}
      showDisabledMonthNavigation 
      onChangeRaw={ (e) => {e.preventDefault()}}
  />
  { this.props.isRangerPicker &&
  <DatePicker
      selected={this.state.endDate}
      selectsEnd
      startDate={this.state.startDate}
      endDate={this.state.endDate}
      dateFormat="MMM-yy"
      showMonthYearPicker
      onChange={this.handleChangeEnd}
      minDate={this.state.startDate}
      maxDate={new Date()}
      showDisabledMonthNavigation 
      onChangeRaw={ (e) => {e.preventDefault()}}
  />
  }</div>
    );
  }
}

