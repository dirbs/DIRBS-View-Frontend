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
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import DateSearchForm from './../../components/Form/DateSearchForm';
import {unique_437_colors, getAuthHeader, instance, errors, getUniqueKeys, yAxisKeysCleaning, getUserRole, getUserType, removeDevicesLabel, scrollOsetTopPlus, fixFilOsetHeightMinus} from "./../../utilities/helpers";
import Barchart from './../../components/Charts/Commons/Barchart';
import Linechart from './../../components/Charts/Commons/Linechart';
import Areachart from './../../components/Charts/Commons/AreaChart';
import SearchFilters from "./../../components/Form/SearchFilters";
import {SearchInfo} from "./../../components/Help/SearchInfo";
import { stackBarTwentyColors, multiColorStack, BoxesColors } from './../../utilities/chart_colors';
import HeaderCards from '../../components/Cards/HeaderCards';
import { noOfReportedDevices, noOfTopStolenBrands, statusOfReportedDevices, topModelsbyReportedDevices, noOfLostStolenDevices } from './../../utilities/reportsInfo';
import svgSymbol from './../../images/svg_symbol.svg';
import { Responsive, WidthProvider } from "react-grid-layout";
import _ from 'lodash';
const ResponsiveReactGridLayout = WidthProvider(Responsive);

class Trends extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      active: false,
      fading: false,
      isShowingFilters: true,
      disableSaveButton: true,
      uniqueBrands: [],
      uniqueModels: [],
      uniqueIncidents: [],
      uniqueStatus: [],
      lsdsTotalReportedDevicesData: null,
      lsdsIncidentTypeData: null,
      lsdsCaseStatusData: null,
      lsdsTopStolenBrandsData: null,
      lsdsTopStolenModelsData: null,
      lsdsTotalReportedDevicesLoading: false,
      lsdsIncidentTypeLoading: false,
      lsdsCaseStatusLoading: false,
      lsdsTopStolenBrandsLoading: false,
      lsdsTopStolenModelsLoading: false,
      apiFetched: false,
      searchQuery: {},
      granularity: "",
      stolen: '',
      lost: '',
      pending: '',
      recovered: '',
      blocked: '',
      totalReportedDevices: '',
      subSystem: 'lsds',
      currentBreakpoint: "lg",
      compactType: "vertical",
      mounted: false,
      layouts: { lg: props.initialLayout },
      layout: [],
      rowHeight: window.innerWidth < 1300 ? 3.7 : 10.6,
      deletedObj: { lsdsTotalReportedDevicesKey: false, lsdsCaseStatusKey: false, lsdsTopStolenBrandsKey: false, lsdsTopStolenModelsKey: false, lsdsIncidentTypeKey: false}
    }
    this.getGraphDataFromServer = this.getGraphDataFromServer.bind(this);
    this.saveSearchQuery = this.saveSearchQuery.bind(this);
    this.updateTokenHOC = this.updateTokenHOC.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.onRemoveItem = this.onRemoveItem.bind(this);
    this.resetChartConfig = this.resetChartConfig.bind(this);
  }

  componentDidMount() {
    const el = document.getElementById('fixFilter');
    this.setState({top: el.offsetTop+scrollOsetTopPlus, height: el.offsetHeight-fixFilOsetHeightMinus});
    window.addEventListener('scroll', this.handleScroll);
    this.setState({ mounted: true });
    this.getChartConfigFromServer();
  }

  componentDidUpdate() {
    const paddDiv = document.getElementById('filterData');
    this.state.scroll > this.state.top ? 
    paddDiv.style.paddingTop = `${this.state.height}px` :
    paddDiv.style.paddingTop = 0;
  }

  _onClick = () => {
    this.setState({ 
      active: !this.state.active 
    });
  }

  onBreakpointChange(breakpoint) {
    this.setState({
      currentBreakpoint: breakpoint
    });
  }

  onLayoutChange(layout) {
    this.setState({ layout: layout, disableSaveButton: false });
  }

  saveChartConfig = () => {
    this.updateTokenHOC(this.setChartConfigToServer);
  }

  onWidthChangeMethod = (width, margin, cols) => {
    var height = this.state.rowHeight;
    if(width > 1300)
    {
     height = width * 1/(cols + 75);
    }
    else if(width <= 1300) {
      height = width * 1/(cols + 195);
    }
    this.setState({
        rowHeight: height
    });
  }

  onRemoveItem(i) {
     this.setState({ layouts: { lg: _.reject(this.state.layout, { i: i })} }, () => {
      let { deletedObj } = this.state;
      deletedObj[i] = true;
      this.setState({ deletedObj: deletedObj });
    })

  }
  
  getChartConfigFromServer = () => 
  {
    instance.get('/get-user-dashboard?user_id=' + this.props.kc.userInfo.preferred_username + '&subsystem=' + this.state.subSystem )
    .then(response => {
        if(response.data.message) {
        } else {
          const retrievedChartConfig = response.data.config;
                if(retrievedChartConfig !== undefined && retrievedChartConfig !== null)
          {
            if(retrievedChartConfig.length !== 0)
            {
            let { deletedObj } = this.state;
            Object.keys(deletedObj).map((key, j) => 
            {
              let isDeleted = true;
              retrievedChartConfig.map((ele, k) =>
              {
                if(key === retrievedChartConfig[k].i && retrievedChartConfig[k].w !== 1)
                {
                  isDeleted = false
                }
                return null;
              })
              deletedObj[key] = isDeleted;
              return null;
            })
            this.setState({ layouts: { lg: retrievedChartConfig }, deletedObj: deletedObj  });
            }
          }   
         }
    })
  }

  setChartConfigToServer = (config) => 
  {
    this.setState({fading: true})
    this.change = setTimeout(() => {
      this.setState({fading: false})
    }, 2000);
    this.setState({ 
      active: false
    });
    let setChartObj = {};
    setChartObj.user_id = this.props.kc.userInfo.preferred_username;
    setChartObj.subsystem = this.state.subSystem;
    setChartObj.config = this.state.layout
          instance.post('/set-user-dashboard', setChartObj, config)
        .then(response => {
            if(response.data.message) {
            } else {
            }
        })
        .catch(error => {
            errors(this, error);
        })
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll() {
    this.setState({scroll: window.scrollY});
  }
  
    //returns randomized color array from single array of colors.

    getColorArray = (n) => unique_437_colors.slice(n);

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
// Next two function are responsible for toggeling sidebar and filter component
  
filtersSidebarDisplay = () =>
{
    this.showHideFilters();
    document.body.classList.add('brand-minimized');
    document.body.classList.add('sidebar-minimized');
}

showHideFilters = () =>
{
  const div = document.getElementById('searchFormDiv');
    if(this.state.isShowingFilters)
    {
      div.style.display= 'none';  
    }
    else if(!this.state.isShowingFilters)
    {
      div.style.display= 'block';  
    }
    this.setState((prevState) => ({
      isShowingFilters: !prevState.isShowingFilters
      })); 
} 

  getElementHeight = (e) => {
    if (e) {
      return e.offsetHeight - 70;
    }
    return 400
  }

   resetChartConfig()
   {
    this.setState({fading: true})
    this.change = setTimeout(() => {
      this.setState({fading: false})
    }, 2000);
    this.setState({ layouts: { lg: _.reject(this.state.layout, { i: 'lsdsTopStolenModelsKey' })} }, () => {
    let { deletedObj } = this.state;
    deletedObj.lsdsTotalReportedDevicesKey = false;
    deletedObj.lsdsCaseStatusKey = false;
    deletedObj.lsdsTopStolenBrandsKey = false;
    deletedObj.lsdsTopStolenModelsKey = false;
    deletedObj.lsdsIncidentTypeKey = false;
    this.setState({ deletedObj: deletedObj, layouts: { lg: this.props.initialLayout } });
    })
  }


  saveSearchQuery(values) {
    this.setState({ searchQuery: values, lsdsTotalReportedDevicesLoading: true, lsdsIncidentTypeLoading: true, lsdsCaseStatusLoading: true, lsdsTopStolenBrandsLoading: true, lsdsTopStolenModelsLoading: true, lsdsTotalReportedDevicesData: [], lsdsIncidentTypeData: [], lsdsCaseStatusData: [], lsdsTopStolenBrandsData: [], lsdsTopStolenModelsData: [], apiFetched: true} , () => {
      this.updateTokenHOC(this.getGraphDataFromServer);
	  })
  }

  getGraphDataFromServer(config) {
      const searchQuery = this.state.searchQuery;
      let type = getUserType(this.props.resources)
      let role = getUserRole(this.props.resources)
      let postData = {
        ...searchQuery,
        type,
        role
      }

      instance.post('/lsds-06-main-counters',postData, config)
        .then(response => {
          const data = Object.assign({}, ...response.data.lsds_boxes);
          this.setState({
              stolen: data.Stolen,
              lost: data.Lost,
              pending: data.Pending,
              blocked: data.Blocked,
              recovered: data.Recovered,
              totalReportedDevices: data.total_reported_devices
          })
          var resizeEvent = window.document.createEvent('UIEvents'); 
          resizeEvent.initUIEvent('resize', true, false, window, 0); 
          window.dispatchEvent(resizeEvent);
        })

      instance.post('/lsds-01-total-reported-devices', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ lsdsTotalReportedDevicesLoading: false });
              } else {
                this.setState({ lsdsTotalReportedDevicesData: response.data.results, lsdsTotalReportedDevicesLoading: false, granularity: searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })
      
      instance.post('/lsds-02-incident-types-chart', postData, config)
          .then(response => {
                let cleanData = removeDevicesLabel(response.data.results);
                let uniqueIncidents = getUniqueKeys(cleanData);
                this.setState({ lsdsIncidentTypeData: cleanData, lsdsIncidentTypeLoading: false, uniqueIncidents: uniqueIncidents, granularity: searchQuery.granularity});
          })
          .catch(error => {
              errors(this, error);
          })
      
      instance.post('/lsds-03-case-status-chart', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ lsdsCaseStatusLoading: false });
              } else {
                let cleanData = yAxisKeysCleaning(response.data.results);
                let uniqueStatus = getUniqueKeys(cleanData);
                this.setState({ lsdsCaseStatusData: cleanData, lsdsCaseStatusLoading: false, uniqueStatus: uniqueStatus, granularity: searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })
      
      instance.post('/lsds-04-top-stolen-brands', postData, config)
          .then(response => {
              let cleanData = yAxisKeysCleaning(response.data.results);
              let uniqueBrands = getUniqueKeys(cleanData);
              this.setState({ lsdsTopStolenBrandsData: cleanData, uniqueBrands: uniqueBrands, lsdsTopStolenBrandsLoading: false, granularity: searchQuery.granularity});
          })
          .catch(error => {
              errors(this, error);
          })

      instance.post('/lsds-05-top-stolen-models', postData, config)
          .then(response => {
              let cleanData = yAxisKeysCleaning(response.data.results);
              let uniqueModels = getUniqueKeys(cleanData);
              this.setState({ lsdsTopStolenModelsData: cleanData, uniqueModels: uniqueModels, lsdsTopStolenModelsLoading: false, granularity: searchQuery.granularity});
          })
          .catch(error => {
              errors(this, error);
          })
  }

  render() {
    const {apiFetched, lsdsTotalReportedDevicesData, lsdsIncidentTypeData, lsdsCaseStatusData, lsdsTopStolenBrandsData, lsdsTopStolenModelsData, lsdsTotalReportedDevicesLoading, lsdsIncidentTypeLoading, lsdsCaseStatusLoading, lsdsTopStolenBrandsLoading, lsdsTopStolenModelsLoading, uniqueBrands, uniqueModels, uniqueStatus, uniqueIncidents, granularity, stolen, lost, pending, blocked, recovered, totalReportedDevices, deletedObj} = this.state;
    return (
      <Container fluid>
        <div className="search-box animated fadeIn">
          { apiFetched &&
            <article className="overview">
              <Row>
                <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#FEAC55" cardTitle="Reported Devices" cardText={totalReportedDevices}/></Col>
                <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#ED6364" cardTitle="Stolen Devices" cardText={stolen}/></Col>
                <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#F07C7C" cardTitle="Lost Devices" cardText={lost}/></Col>
                <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0BD49C" cardTitle="Recovered Devices" cardText={recovered}/></Col>
                <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0B6EDE" cardTitle="Pending Devices" cardText={pending}/></Col>
                <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#ED6364" cardTitle="Blocked Devices" cardText={blocked}/></Col>
              </Row>
            </article>
          }
          <div id="fixFilter" className={this.state.scroll > this.state.top ? "filters fixed-filter" : "filters"}>
            {!this.state.isShowingFilters ?
              <Card className="outline-theme-alfa4 applied-filters"> 
                <CardBody>
                  <div className="filter-toggler-control">
                    <h6>Applied Filters:</h6>
                  </div>
                  <div id="searchFormDiv" style={{"display": "block"}}>
                    <DateSearchForm callServer={this.saveSearchQuery} showHideComponents={this.filtersSidebarDisplay}/>
                  </div>
                  <div style={{"display": "block"}}>
                    <SearchFilters filters={this.state.searchQuery} />
                  </div>
                  {apiFetched &&
                    <div className="toggler-button eft-tip" onClick={this.showHideFilters}><svg><use xlinkHref={svgSymbol + '#pencil'} /></svg>
                      <div className="eft-text">Click to edit filters</div>
                    </div>
                  }
                </CardBody>
              </Card>
              :
              <Card className={apiFetched ? 'outline-theme-alfa4' : 'outline-theme-alfa4 jc-center'}>
                <CardBody>
                  <div className="filter-toggler-control">
                    <h6>Apply Filters:</h6>
                  </div>
                  <div id="searchFormDiv" style={{"display": "block"}}>
                    <DateSearchForm callServer={this.saveSearchQuery} showHideComponents={this.filtersSidebarDisplay}/>
                  </div>
                  <div style={{"display": "none"}}>
                    <SearchFilters filters={this.state.searchQuery} />
                  </div>
                  {apiFetched &&
                    <div className="toggler-button" onClick={this.showHideFilters}><svg><use xlinkHref={svgSymbol + '#pencil'} /></svg></div>
                  }
                </CardBody> 
              </Card>
            }
          </div>
          {!apiFetched &&
            <SearchInfo />
          }
          <div id="filterData">
            {apiFetched
              ? <React.Fragment>
                <article className={this.state.active ? 'buttons-active button-config-chart' : 'button-config-chart'}>
                  <button
                    className="btn btn-save"
                    disabled={this.state.disableSaveButton}
                    onClick={this.saveChartConfig}
                  >Save</button>
                  <button
                    className="btn btn-reset"
                    onClick={this.resetChartConfig}
                  >Reset</button>
                  <button 
                    className={this.state.fading ? 'button--large btn-fading' : 'button--large'}
                    onClick={this._onClick} 
                    style={this.state.active ? { transform: 'scale(1)' } : { transform: 'scale(0.8333)' }}
                  >
                    <span className={this.state.active ? 'icon active' : 'icon'} />
                  </button>
                </article>

                <div className="grid-box">
                  <ResponsiveReactGridLayout
                   {...this.props}
                    layouts={this.state.layouts}
                    onBreakpointChange={this.onBreakpointChange}
                    onLayoutChange={this.onLayoutChange}
                    measureBeforeMount={true}
                    useCSSTransforms={this.state.mounted}
                    compactType={this.state.compactType}
                    preventCollision={!this.state.compactType}
                    autoSize={true}
                    rowHeight={this.state.rowHeight}
                    onWidthChange={this.onWidthChangeMethod}
                  > 
                    <div name='lsdsTotalReportedDevicesKey' key="lsdsTotalReportedDevicesKey" className={deletedObj.lsdsTotalReportedDevicesKey === true && 'hidden'}>
                      <Linechart cardClass="card-warning" title="Number of Reported Devices" loading={lsdsTotalReportedDevicesLoading} data={lsdsTotalReportedDevicesData} xAxis="x_axis" yAxisLabel="Total number of devices" yAxes={["unique_devices"]}  colorArray={this.getColorArray(32)} granularity={granularity} info={noOfReportedDevices} showLegend="false" heightProp={this.getElementHeight(document.getElementsByName('lsdsTotalReportedDevicesKey')[0])} removeChart={this.onRemoveItem} chartGridId={'lsdsTotalReportedDevicesKey'}/>
                    </div>
                    <div name='lsdsCaseStatusKey' key="lsdsCaseStatusKey" className={deletedObj.lsdsCaseStatusKey === true && 'hidden'}>
                      <Barchart cardClass="card-info" title="Status of Reported Devices" heightProp={this.getElementHeight(document.getElementsByName('lsdsCaseStatusKey')[0])} loading={lsdsCaseStatusLoading} data={lsdsCaseStatusData} xAxis="x_axis" yAxisLabel="Number of devices reported by users" yAxes={uniqueStatus} yAxesComposite={["Pending","Blocked", "Recovered"]} colorArray={stackBarTwentyColors.slice(4)} granularity={granularity}  info={statusOfReportedDevices} removeChart={this.onRemoveItem} chartGridId={'lsdsCaseStatusKey'}/>
                    </div>
                    <div name='lsdsTopStolenBrandsKey' key="lsdsTopStolenBrandsKey" className={deletedObj.lsdsTopStolenBrandsKey === true && 'hidden'}>
                      <Barchart cardClass="card-danger" title="Top Stolen Brands" heightProp={this.getElementHeight(document.getElementsByName('lsdsTopStolenBrandsKey')[0])} loading={lsdsTopStolenBrandsLoading} data={lsdsTopStolenBrandsData} yAxisLabel="Total number of devices reported" yAxes={uniqueBrands} xAxis="x_axis"  colorArray={multiColorStack} granularity={granularity}  info={noOfTopStolenBrands} removeChart={this.onRemoveItem} chartGridId={'lsdsTopStolenBrandsKey'}/>
                    </div>    
                    <div name='lsdsTopStolenModelsKey' key="lsdsTopStolenModelsKey" className={deletedObj.lsdsTopStolenModelsKey === true && 'hidden'}>
                      <Barchart cardClass="card-primary" title="Top Models by Reported Devices" heightProp={this.getElementHeight(document.getElementsByName('lsdsTopStolenModelsKey')[0])} loading={lsdsTopStolenModelsLoading} data={lsdsTopStolenModelsData} yAxisLabel="Number of devices reported by users" yAxes={uniqueModels} xAxis="x_axis" colorArray={multiColorStack} granularity={granularity}  info={topModelsbyReportedDevices} removeChart={this.onRemoveItem} chartGridId={'lsdsTopStolenModelsKey'}/>
                    </div> 
                    <div name='lsdsIncidentTypeKey' key="lsdsIncidentTypeKey" className={deletedObj.lsdsIncidentTypeKey === true && 'hidden'}>
                        <Areachart cardClass="card-warning" title="Incident Nature of Reported Devices" heightProp={this.getElementHeight(document.getElementsByName('lsdsIncidentTypeKey')[0])} loading={lsdsIncidentTypeLoading} data={lsdsIncidentTypeData} yAxisLabel="Total number of devices reported by users" xAxis="x_axis" yAxes={uniqueIncidents} colorArray={BoxesColors.slice(4)} granularity={granularity}  removeChart={this.onRemoveItem} chartGridId={'lsdsIncidentTypeKey'} info={noOfLostStolenDevices}/>
                    </div>
                  </ResponsiveReactGridLayout>
                </div>
              </React.Fragment>
              : null
            }
          </div>
        </div>
      </Container>
    )
  }
}

Trends.defaultProps = {
  className: "layout",
  cols: { lg: 100, md: 100, sm: 6, xs: 4, xxs: 2 },
  breakpoints: {lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0},
  initialLayout: [
    {i: 'lsdsTotalReportedDevicesKey', x: 0, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'lsdsCaseStatusKey', x: 0, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'lsdsTopStolenBrandsKey', x: 0, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'lsdsTopStolenModelsKey', x: 50, y: 0, w: 50, h: (50/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'lsdsIncidentTypeKey', x: 50, y: 0, w: 50, h: (50/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) }
  ]
};

export default Trends;