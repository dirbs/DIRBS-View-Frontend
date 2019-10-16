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
import {Container, Row, Col, Progress } from 'reactstrap';
import { getAuthHeader, instance, errors, getUniqueKeys, yAxisFormatter, formateBackEndString, getMappedColors} from "./../../utilities/helpers";
import Linechart from './../../components/Charts/Commons/Linechart';
import DashboardPiechart from './../../components/Charts/Commons/DashboardPiechart';
import RadialBarchart from './../../components/Charts/Commons/RadialBarChart';
import { barBgColors, colorIMEIsPairing, progressBarColors, statusColorsForBlueBG, statusColorArray } from './../../utilities/chart_colors';
import HeaderCards from '../../components/Cards/HeaderCards';

class Dashboard extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      operatorsArray: [],
      isShowingFilters: true,
      TotalOperatorWiseIMEIsCount: 0,  
      TotalOperatorWiseBlockingCount: 0,
      TotalIMEIsCount: 0,
      TotalLostStolenCount: 0,
      ApprovedIMEIsCount: 0,
      approvedIMEIB10Count: 0,
      detailIMEIs: null,
      uniqueOperatorWiseTrend: [],
      uniqueLostStolenDeviceTrend: [],
      uniqueModels: [],
      uniqueIncidents: [],
      uniqueStatus: [],
      OperatorWiseIMEIsData: null,
      OperatorWiseTrendData: null,
      OperatorWiseBlockingData: null,
      TotalIMEIsData: null,
      RegisteredDeviceTechnologyData: null,
      TopRegisteredBrandsData: null,
      dashBoardTotalData: null,
      PairingTypesData: null,
      ActivePairsData: null,
      PairsClassificationData: null,
      DeviceStatusData: null,
      DeviceTrendData: null,
      MostStolenBrandsData: null,
      apiFetched: false,
      totalIMEIs: {},
      compliantIMEIs: {},
      nonCompliantIMEIs: {},
      pairedIMEIs: {},
      reportedDevices: {},
      registeredIMEIs: {},
      dashboardLastUpdate: null
    }
    this.getDashBoardDataFromServer = this.getDashBoardDataFromServer.bind(this);
    this.updateTokenHOC = this.updateTokenHOC.bind(this);
  }

  componentDidMount() {
    this.props.breadcrumbSwitch("On");
    this.getDashBoardDataFromServer();
    document.body.classList.add('brand-minimized');
    document.body.classList.add('sidebar-minimized');
  }
  componentWillUnmount(){
    this.props.breadcrumbSwitch("Off");
  }

  updateTokenHOC(callingFunc) {
      let config = null;
      if(this.props.kc.isTokenExpired(0)) {
          this.props.kc.updateToken(0)
              .success(() => {
                  localStorage.setItem('token', this.props.kc.token)
                  config = {
                    headers: getAuthHeader(this.props.kc.token)
                  }
                  callingFunc(config);
              })
              .error(() => this.props.kc.logout());
      } else {
          config = {
            headers: getAuthHeader()
          }
          callingFunc(config);
      }
  }

  formateDataForB12 = (dataToFormate, Colors) => {
    let dataArray = [];
     Object.keys(dataToFormate).map((key, i) => 
       dataArray.push({'y_axis' : key, 'x_axis': dataToFormate[key], 'fill': Colors[i]})
      );
     return dataArray;

}

  formateDataForB13 = (dataToFormate, Colors) => {
    let dataArray = [];
      dataArray.push({'name' : Object.keys(dataToFormate)[0], 'value': dataToFormate.secondary_pairs + dataToFormate.primary_pairs, 'fill': 'white' });
      dataArray.push({'name' : Object.keys(dataToFormate)[1], 'value': dataToFormate.primary_pairs, 'fill': Colors[1]})
     return dataArray;

}

  formateDataForB14 = (dataToFormate) => {
    let dataArray = [];
     let colorArray =  getMappedColors(Object.entries(dataToFormate).map((e) => ({ [e[0]]: e[1] })), this.state.operatorsArray);
     Object.keys(dataToFormate).map((key, i) => 
       dataArray.push({'name' : key, 'value': dataToFormate[key], 'fill': colorArray[i]})
      );
      dataArray.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
      return dataArray;
  }



  getDashBoardDataFromServer(config) {

      instance.get('/view-dashboard')
          .then(response => {
              if(response.data.message) {
              } else {
                let formatedOperatorWiseIMEIs = Object.entries(response.data.B7_operator_wise_imeis).map((e) => ({ [e[0]]: e[1] }));
                let sortedOperatorWiseIMEIs  = formatedOperatorWiseIMEIs.sort((a, b) => parseFloat(b[Object.keys(b)[0]]) - parseFloat(a[Object.keys(a)[0]]));
                let formatedOperatorWiseBlocking = Object.entries(response.data.B9_operator_wise_blocked_imeis).map((e) => ({ [e[0]]: e[1] }));
                let sortedOperatorWiseBlocking =  formatedOperatorWiseBlocking.sort((a, b) => parseFloat(b[Object.keys(b)[0]]) - parseFloat(a[Object.keys(a)[0]]));
                let formatedTotalIMEIs = Object.entries(response.data.B10_drs_imeis_trend.drs_imei_status).map((e) => ({ [e[0]]: e[1] }));
                let sortedTotalIMEIs =  formatedTotalIMEIs.sort((a, b) => parseFloat(b[Object.keys(b)[0]]) - parseFloat(a[Object.keys(a)[0]]));
                let formatedPairsClassification = Object.entries(response.data.B15_dps_pairs_classification).map((e) => ({ [e[0]]: e[1] }));
                let sortedPairsClassification =  formatedPairsClassification.sort((a, b) => parseFloat(b[Object.keys(b)[0]]) - parseFloat(a[Object.keys(a)[0]]));
                let uniqueOperatorWiseTrend = getUniqueKeys(response.data.B8_operators_imeis_trend.six_months_trend);
                let uniqueDeviceTrend = getUniqueKeys(response.data.B17_lsds_devices_trend.lsds_six_months_trend);
                this.setState({ totalIMEIs: response.data.B1_core_total_imeis,
                  compliantIMEIs: response.data.B2_core_compliant_imeis,
                  nonCompliantIMEIs: response.data.B3_core_non_compliant_imeis,
                  pairedIMEIs: response.data.B4_dps_paired_imeis,
                  reportedDevices: response.data.B5_lsds_reported_devices,
                  registeredIMEIs: response.data.B6_drs_registered_imeis,
                  apiFetched: true,
                  OperatorWiseIMEIsData: sortedOperatorWiseIMEIs.filter(x => !Object.keys(x)[0].includes('total_MNOs_IMEIs')),
                  TotalOperatorWiseIMEIsCount: response.data.B7_operator_wise_imeis.total_MNOs_IMEIs,
                  uniqueOperatorWiseTrend: uniqueOperatorWiseTrend,
                  OperatorWiseTrendData: response.data.B8_operators_imeis_trend.six_months_trend,
                  OperatorWiseBlockingData: sortedOperatorWiseBlocking.filter(x => !Object.keys(x)[0].includes('total_blocked_IMEIs')),
                  TotalOperatorWiseBlockingCount: response.data.B9_operator_wise_blocked_imeis.total_blocked_IMEIs,
                  TotalIMEIsData: sortedTotalIMEIs.filter(x => !Object.keys(x)[0].includes('statuses_percentage')),
                  TotalIMEIsCount: response.data.B10_drs_imeis_trend.total_drs_imeis,
                  ApprovedIMEIsCount: response.data.B10_drs_imeis_trend.drs_approved_devices,
                  approvedIMEIB10Count: response.data.B10_drs_imeis_trend.drs_imei_status.Approved,
                  detailIMEIs: response.data.B10_drs_imeis_trend.last_3_months_imeis,
                  RegisteredDeviceTechnologyData: response.data.B11_drs_technology_wise_devices.approved_devices,
                  TopRegisteredBrandsData: response.data.B12_drs_top_approved_brands.drs_top_brands,
                  dashBoardTotalData: response.data.B12_drs_top_approved_brands.total_top_brands,
                  PairingTypesData: response.data.B13_dps_pairing_types_count,
                  ActivePairsData: response.data.B14_dps_operators_active_pairs,
                  PairsClassificationData: sortedPairsClassification,
                  DeviceStatusData: response.data.B16_lsds_devices_status.statuses,
                  TotalLostStolenCount: response.data.B16_lsds_devices_status.total_devices,
                  uniqueLostStolenDeviceTrend: uniqueDeviceTrend,
                  DeviceTrendData: response.data.B17_lsds_devices_trend.lsds_six_months_trend,
                  MostStolenBrandsData: response.data.B18_lsds_top_brands
                   });
              }
          })
          .catch(error => {
              errors(this, error);
          })
  }

  UNSAFE_componentWillMount()
  {
    instance.get('/mno-names')
    .then(response => {
      const data = response.data.MNO_Details
       this.setState({operatorsArray: data});         
      }) 
  }

  render() {
    const {apiFetched, OperatorWiseIMEIsData, OperatorWiseTrendData, OperatorWiseBlockingData, TotalIMEIsData, RegisteredDeviceTechnologyData, TopRegisteredBrandsData, dashBoardTotalData, TotalLostStolenCount, approvedIMEIB10Count, PairingTypesData, ActivePairsData, PairsClassificationData, DeviceStatusData, DeviceTrendData, MostStolenBrandsData, uniqueOperatorWiseTrend, granularity, totalIMEIs, compliantIMEIs, nonCompliantIMEIs, ApprovedIMEIsCount, pairedIMEIs, reportedDevices, registeredIMEIs, TotalOperatorWiseIMEIsCount, TotalOperatorWiseBlockingCount, TotalIMEIsCount, detailIMEIs, uniqueLostStolenDeviceTrend, operatorsArray} = this.state;
    const colorClasses = ['bar1', 'bar2', 'bar3', 'bar4'];
    const stolenBarClasses = ['stolen-bar1', 'stolen-bar2', 'stolen-bar3'];
    return (
      <Container fluid className="dashboard-container" style={{ padding: '0 15px' }}>
        <div className="search-box animated fadeIn">
                  { apiFetched &&
          <article className="overview">
            <div className="last-updated" 
              style={{ 
                textAlign: 'right',
                position: 'fixed',
                top: '16px',
                right: '160px',
                color: '#fff',
                fontSize: '1rem',
                zIndex: '1030'
              }}
            ><span>Last Updated: </span>{dashboardLastUpdate}</div>
            <Row>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0B6EDE" cardTitle="Total IMEIs" cardText={totalIMEIs.total_core_imeis} avg={totalIMEIs.monthly_total_imeis_avg} trend={totalIMEIs.total_trend_up} percentage={totalIMEIs.total_avg_trend}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0093C7" cardTitle="Total Valid IMEIs" cardText={compliantIMEIs.core_compliant_imeis} avg={compliantIMEIs.monthly_compliant_imeis_avg} trend={compliantIMEIs.compliant_trend_up} percentage={compliantIMEIs.compliant_avg_trend}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#F07C7C" cardTitle="Total Invalid IMEIs" cardText={nonCompliantIMEIs.total_non_compliant_imeis} avg={nonCompliantIMEIs.monthly_non_compliant_imeis_avg} trend={nonCompliantIMEIs.non_compliant_trend_up} percentage={nonCompliantIMEIs.non_compliant_avg_trend}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0BD49C" cardTitle="Total Paired IMEIs" cardText={pairedIMEIs.total_dps_imeis} avg={pairedIMEIs.monthly_dps_imeis_avg} trend={pairedIMEIs.dps_trend_up} percentage={pairedIMEIs.dps_avg_trend}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#ED6364" cardTitle="Total Stolen Devices" cardText={reportedDevices.total_lsds_devices} avg={reportedDevices.monthly_lsds_devices_avg} trend={reportedDevices.lsds_trend_up} percentage={reportedDevices.lsds_avg_trend}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#FEAC55" cardTitle="Total Registered IMEIs" cardText={registeredIMEIs.total_drs_imeis} avg={registeredIMEIs.monthly_drs_imeis_avg} trend={registeredIMEIs.drs_trend_up} percentage={registeredIMEIs.drs_avg_trend}/></Col>
            </Row>
          </article>
          }
          <div className="grid-space15">
          {apiFetched
            ? <React.Fragment>
              {/* <div className="column-row"> */}
              <Row>
                <Col xl={3} lg={4} md={6}>
                  <div className="column-header" style={{ backgroundColor: '#ED6364' }}>
                    <h6>DIRBS Core</h6>
                  </div>
                  <div className="box-bgwhite box-shadow radius-p75rem" style={{ border: '#ED6364 1px solid' }}>

                    <div className="box-item">
                      <div className="eq-height-box">
                      <div className="eq-height">

                      <div className="box-item-header">
                        <h6 className="item-h6">Operator Wise IMEIs</h6>
                        <h5 className="item-h5">{yAxisFormatter(TotalOperatorWiseIMEIsCount)}</h5>
                      </div>

                      <div className="box-item-body">
                        <div className="box-list">
                          <ul className="item-list">
                            {OperatorWiseIMEIsData.map((val, i) => {
                              return (
                                <li key={i} style={{color: getMappedColors(OperatorWiseIMEIsData, operatorsArray)[i]}}><p><label>{formateBackEndString(Object.keys(val)[0])}</label>{val[Object.keys(val)[0]].toLocaleString()}</p></li>
                              );
                            })}
                          </ul>
                        </div>
                        <div className="radial-position-control">
                          <h5 className="radial-percent" style={{color: getMappedColors(OperatorWiseIMEIsData, operatorsArray)[0]}}>{((OperatorWiseIMEIsData[0][Object.keys(OperatorWiseIMEIsData[0])[0]]/TotalOperatorWiseIMEIsCount) * 100).toFixed(1)}%</h5>
                          <DashboardPiechart data={OperatorWiseIMEIsData} value="value" colorArray={getMappedColors(OperatorWiseIMEIsData, operatorsArray)} innerRadiusProp='65%' showLegend={false} isShowHeader={false} isShowLable={false} />
                        </div>
                      </div>

                      </div>
                      </div>

                    </div>

                    <div className="box-item">
                      <div className="eq-height-box">
                      <div className="eq-height">

                      <div className="box-item-header">
                        <h6 className="item-h6">Operator Wise Trend</h6>
                      </div>

                      <div className="box-item-body">
                        <div className="item-chart">
                          <Linechart title="Operator Wise Trend" cardClass="card-dashboard" data={OperatorWiseTrendData} xAxis="trend_date" yAxes={uniqueOperatorWiseTrend} colorArray={getMappedColors(Object.entries(OperatorWiseTrendData[0]).map((e) => ({ [e[0]]: e[1] })), operatorsArray)} granularity={granularity} showLegend={false} isShowHeader={false} isShowLable={false} ignoreYaxis="trend_date"  yAxisLabelWidth={36}/>
                        </div>
                      </div>

                      </div>
                      </div>
                    </div>

                    <div className="box-item">
                      <div className="eq-height-box">
                      <div className="eq-height">

                      <div className="box-item-header">
                        <h6 className="item-h6">Operator Wise Blocking</h6>
                        <h5 className="item-h5">{yAxisFormatter(TotalOperatorWiseBlockingCount)}</h5>
                      </div>
                      <div className="box-item-body">
                        <div className="box-list">
                          <ul className="item-list">
                            {OperatorWiseBlockingData.map((val, i) => {
                              return (
                                <li key={i} style={{color: getMappedColors(OperatorWiseBlockingData, operatorsArray)[i]}}><p><label>{formateBackEndString(Object.keys(val)[0])}</label>{val[Object.keys(val)[0]].toLocaleString()}</p></li>
                              );
                            })}
                          </ul>
                        </div>
                        <div className="item-chart radial-position-control">
                            <h5 className="radial-percent">{((TotalOperatorWiseBlockingCount/TotalOperatorWiseIMEIsCount) * 100).toFixed(1)}%</h5>
                            <DashboardPiechart data={OperatorWiseBlockingData} value="value" colorArray={getMappedColors(OperatorWiseBlockingData, operatorsArray)} innerRadiusProp='65%' showLegend={false} isShowHeader={false} isShowLable={false} />
                        </div>
                      </div>

                      </div>
                      </div>
                    </div>

                  </div>
                </Col>
                <Col xl={3} lg={4} md={6}>
                  <div className="column-header" style={{ backgroundColor: '#0093C7' }}>
                    <h6>Device Registration Subsystem</h6>
                  </div>
                  <div className="box-bgwhite box-shadow radius-p75rem" style={{ border: '#0093C7 1px solid' }}>

                    <div className="box-item">
                      <div className="eq-height-box">
                      <div className="eq-height">

                      <div className="box-item-header">
                        <h6 className="item-h6">Total IMEIs</h6>
                        <h5 className="item-h5">{yAxisFormatter(totalB10Count)}</h5>
                      </div>

                      <div className="box-item-body">
                        <div className="box-list">
                          <h5 className="item-h5" style={{color: '#0BD49C'}}>{yAxisFormatter(TotalIMEIsCount)}</h5>
                          <div className="h5-list">
                            {Object.keys(detailIMEIs).map((key) => {
                              return (
                                <h6 key={key}><span>{key}</span>{yAxisFormatter(detailIMEIs[key])}</h6>
                              );
                            })}
                          </div>
                          <p className="approved-devices"><span>Approved Devices </span>|<big>{yAxisFormatter(ApprovedIMEIsCount)}</big></p>
                        </div>
                        <div className="radial-position-control">
                          <h5 className="radial-percent-grey">{((approvedIMEIB10Count/TotalIMEIsCount) * 100).toFixed(1)}%</h5>
                          <DashboardPiechart data={TotalIMEIsData} value="value" colorArray={statusColorsForBlueBG} innerRadiusProp='63%' showLegend={false} isShowHeader={false} isShowLable={false} />
                        </div>
                      </div>

                      </div>
                      </div>
                    </div>


                    <div className="box-item">
                      <div className="eq-height-box">
                      <div className="eq-height">

                      <div className="box-item-header">
                        <h6 className="item-h6">Registered Device Technology</h6>
                      </div>

                      <div className="box-item-body">
                        <div className="item-chart" style={{ marginTop: '10px' }}>
                          {
                            RegisteredDeviceTechnologyData.sort((a, b) => parseFloat(b[Object.keys(b)[0]]) - parseFloat(a[Object.keys(a)[0]])).map((elem, index)=>
                            {
                              return <Progress key={index} style={{marginBottom: '8px', borderRadius: '9px', height: '21.2px', borderTop: 'transparent 1px solid'}} value={parseFloat(elem.percentage)} color={colorClasses[index]}><span style={parseFloat(elem.percentage) > 22 ? { color: '#fff'} : { color: '#000'}}>{elem.y_axis} | {Math.round(parseFloat(elem.percentage))}%</span></Progress>
                            })
                          }                    
                        </div>
                      </div>

                      </div>
                      </div>
                    </div>

                    <div className="box-item">
                      <div className="eq-height-box">
                      <div className="eq-height">

                      <div className="box-item-header">
                        <h6 className="item-h6">Top Registered Brands</h6>
                      </div>

                      <div className="box-item-body">
                        <div className="item-chart">
                          <div className="dflex jc-sb" style={{fontSize: '10px'}}>
                            <div>0%</div>
                            <div>100%</div>
                          </div>
                            <Progress style={{borderRadius: '0px', height: '70px'}} multi>
                            {Object.keys(TopRegisteredBrandsData).map((elem, i) => {                           
                              {let perc =   (TopRegisteredBrandsData[elem] / dashBoardTotalData) * 100
                               return <div key={i} style={{backgroundColor: progressBarColors[i], width: `${perc}%`}}></div> 
                              }                                                 
                            })}
                            </Progress>
                        </div>
                        <ul className="item-bottom-list" style={{ paddingTop: '5px' }}>
                        {Object.keys(TopRegisteredBrandsData).map((elem, i) => {                           
                            return (
                              <li key={i} style={{color: progressBarColors[i]}}><p><label>{formateBackEndString(elem)}</label></p></li>
                            );
                          })}
                        </ul>
                      </div>

                      </div>
                      </div>
                    </div>

                  </div>
                </Col>
                <Col xl={3} lg={4} md={6}>
                  <div className="column-header" style={{ backgroundColor: '#0BD49C' }}>
                    <h6>Device Pairing Subsystem</h6>
                  </div>
                  <div className="box-bgwhite box-shadow radius-p75rem" style={{ border: '#0BD49C 1px solid' }}>

                    <div className="box-item">
                      <div className="eq-height-box">
                      <div className="eq-height">

                      <div className="box-item-header">
                        <h6 className="item-h6">Pairing Types</h6>
                      </div>

                      <div className="box-item-body">
                        <div className="box-list">
                          <ul className="item-list" style={{ paddingTop: '10px' }}>
                            <li style={{ color: '#2DCD7A'}}><p><label>Primary</label>{PairingTypesData.primary_pairs.toLocaleString()}</p></li>
                            <li><p><label>Secondary</label>{PairingTypesData.secondary_pairs.toLocaleString()}</p></li>
                          </ul>
                        </div>
                        <div className="radial-position-control">
                          <RadialBarchart titleRadialPercent={`${((PairingTypesData.primary_pairs/(PairingTypesData.primary_pairs + PairingTypesData.secondary_pairs)) * 100).toFixed(2)}%`} innerRadiusProp='50%' data={this.formateDataForB13(PairingTypesData, colorIMEIsPairing)} value="value" startAngleProp={245} endAngleProp={-60} barSizeProp={9} isFormateData={false} OperatorArray={operatorsArray}/>
                        </div>
                      </div>

                      </div>
                      </div>
                    </div>

                    <div className="box-item">
                      <div className="eq-height-box">
                      <div className="eq-height">

                      <div className="box-item-header">
                        <h6 className="item-h6">Operator&apos;s Active Pairs</h6>
                      </div>

                      <div className="box-item-body">
                        <div className="box-list">
                          <ul className="item-list">
                            {this.formateDataForB14(ActivePairsData).map((ele, i) => {
                              return (
                                <li key={i} style={{color: ele.fill}}><p><label>{formateBackEndString(ele.name)}</label>{yAxisFormatter(ele.value)}</p></li>
                              );
                            })}
                          </ul>
                        </div>
                        <div className="radial-position-control">
                          <RadialBarchart data={ActivePairsData} value="value" isFormateData={true} OperatorArray={operatorsArray}/>
                        </div>
                      </div>

                      </div>
                      </div>
                    </div>

                    <div className="box-item">
                      <div className="eq-height-box">
                      <div className="eq-height">

                      <div className="box-item-header">
                        <h6 className="item-h6">Pairs Classification</h6>
                      </div>

                      <div className="box-item-body">
                        <div className="box-list">
                          <ul className="item-list">
                            {PairsClassificationData.map((val, i) => {
                              return (
                                <li key={i} style={{color: getMappedColors(PairsClassificationData, statusColorArray)[i]}}><p><label>{formateBackEndString(Object.keys(val)[0].slice(0, Object.keys(val)[0].lastIndexOf('_')))}</label>{val[Object.keys(val)[0]].toLocaleString()}</p></li>
                              );
                            })}
                          </ul>
                        </div>
                        <div className="radial-position-control">
                          <DashboardPiechart data={PairsClassificationData} value="value" colorArray={getMappedColors(PairsClassificationData, statusColorArray)} showLegend={false} isShowHeader={false} isShowLable={false} paddingProp={2} />
                        </div>
                      </div>

                      </div>
                      </div>
                    </div>

                  </div>
                </Col>
                <Col xl={3} lg={4} md={6}>
                  <div className="column-header" style={{ backgroundColor: '#FEAC55' }}>
                    <h6>Lost/Stolen Device Subsystem</h6>
                  </div>
                  <div className="box-bgwhite box-shadow radius-p75rem" style={{ border: '#FEAC55 1px solid' }}>

                    <div className="box-item">
                      <div className="eq-height-box">
                      <div className="eq-height">

                      <div className="box-item-header">
                        <h6 className="item-h6">Lost/Stolen Device Status</h6>
                        <h5 className="item-h5">{yAxisFormatter(TotalLostStolenCount)}</h5>
                      </div>

                      <div className="box-item-body">
                        <div className="item-chart" style={{ marginTop: '10px' }}>
                          {
                            DeviceStatusData.map((elem, index)=>
                             {
                               return <Progress key={index} style={{marginBottom: '7px', borderRadius: '8px', height: '21.2px', borderTop: 'transparent 1px solid'}} color={stolenBarClasses[index]} value={parseFloat(elem.percentage)}><span style={parseFloat(elem.percentage) > 22 ? { color: '#fff'} : { color: '#000'}}>{Math.round(parseFloat(elem.percentage))}% | {yAxisFormatter(elem.x_axis)}</span></Progress>
                             })
                          }
                        </div>
                        <ul className="item-bottom-list">
                          {DeviceStatusData.map((val, i) => {
                            return (
                              <li key={i} style={{color: barBgColors[i]}}><p><label>{formateBackEndString(val.y_axis)}</label></p></li>
                            );
                          })}
                        </ul>
                      </div>

                      </div>
                      </div>
                    </div>

                    <div className="box-item">
                      <div className="eq-height-box">
                      <div className="eq-height">

                      <div className="box-item-header">
                        <h6 className="item-h6">Lost/Stolen Device Trend</h6>
                      </div>

                      <div className="box-item-body">
                        <div className="item-chart">
                          <Linechart cardClass="card-dashboard" data={DeviceTrendData} xAxis="trend_date" yAxes={uniqueLostStolenDeviceTrend} colorArray={getMappedColors(Object.entries(DeviceTrendData[0]).map((e) => ({ [e[0]]: e[1] })), statusColorArray)} granularity={granularity} showLegend={false} isShowHeader={false} isShowLable={false} ignoreYaxis="trend_date" yAxisLabelWidth={36} />
                        </div>
                      </div>

                      </div>
                      </div>
                    </div>

                    <div className="box-item">
                      <div className="eq-height-box">
                      <div className="eq-height">

                      <div className="box-item-header">
                        <h6 className="item-h6">Most Stolen Brands</h6>
                      </div>

                      <div className="box-item-body">
                        <div className="item-chart">
                          <div className="dflex jc-sb" style={{fontSize: '10px'}}>
                            <div>0%</div>
                            <div>100%</div>
                          </div>
                            <Progress style={{borderRadius: '0px', height: '70px'}} multi>
                            {Object.keys(MostStolenBrandsData).map((elem, i) => {                           
                              {let perc =   (MostStolenBrandsData[elem] / dashBoardTotalData) * 100
                               return <div key={i} style={{backgroundColor: progressBarColors[i], width: `${perc}%`}}></div> 
                              }                                                 
                            })}
                            </Progress>
                        </div>
                        <ul className="item-bottom-list" style={{ paddingTop: '5px' }}>
                        {Object.keys(MostStolenBrandsData).map((elem, i) => {                           
                            return (
                              <li key={i} style={{color: progressBarColors[i]}}><p><label>{formateBackEndString(elem)}</label></p></li>
                            );
                          })}
                        </ul>
                      </div>

                      </div>
                      </div>
                    </div>

                  </div>
                </Col>
              </Row>
            </React.Fragment>
            : null
          }
          </div>
        </div>
      </Container>
    )
  }
}

export default Dashboard;