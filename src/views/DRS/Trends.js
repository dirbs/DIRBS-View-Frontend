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
import {unique_437_colors, getAuthHeader, instance, errors, getUniqueKeys, yAxisKeysCleaning, getUserType, getUserRole, yAxisToCount, scrollOsetTopPlus, fixFilOsetHeightMinus} from "./../../utilities/helpers";
import Barchart from './../../components/Charts/Commons/Barchart'
import Piechart from '../../components/Charts/Commons/Piechart';
import Areachart from '../../components/Charts/Commons/AreaChart';
import SearchFilters from "./../../components/Form/SearchFilters";
import {SearchInfo} from "./../../components/Help/SearchInfo";
import { blueColors, stackBarTwentyColors, stackBarTetrade,multiColorStack, multiColors, BoxesColors } from './../../utilities/chart_colors';
import HeaderCards from './../../components/Cards/HeaderCards';
import { deviceRegistrationStatus, registeredDevicesCount, deviceOS, deviceTechnology, deviceManufacturingLocation, deviceTopImporters, typeOfRegeisteredDevices, topRegisteredBrands, deviceRegistrationMethod, topRegisteredModels, devicesByIMEISlot } from './../../utilities/reportsInfo';
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
      uniqueLocation: [],
      uniqueSims: [],
      uniqueBrands: [],
      uniqueImie: [],
      uniqueSingleImporter: [],
      uniqueModels: [],
      uniqueTests: [],
      uniqueType: [],
      uniqueTech: [],
      uniqueInputType: [],
      yAxis:[],
      uniqueStatusCount: [],
      drsManufacturingData: null,
      drsNumOfSimsData: null,
      drsRegisteredApprovedIMEIsData: null,
      drsTopDeviceImporterData: null,
      drsInputTypeData: null,
      drsOSTypeData: null,
      drsDeviceTypeData: null,
      drsRatTypeData: null,
      drsTopBrandsData: null,
      drsTopModelsData: null,
      drsCountOfStatusData: null,
      drsManufacturingLoading: false,
      drsNumOfSimsLoading: false,
      drsRegisteredApprovedIMEIsLoading: false,
      drsTopDeviceImporterLoading: false,
      drsInputTypeLoading: false,
      drsOSTypeLoading: false,
      drsDeviceTypeLoading: false,
      drsRatTypeLoading: false,
      drsTopBrandsLoading: false,
      drsTopModelsLoading: false,
      drsCountOfStatusLoading: false,
      apiFetched: false,
      searchQuery: {},
      granularity: "",
      approved: '',
      rejected: '',
      inReview: '',
      totalRegDev: '',
      smartphone: '',
      featPhone: '',
      subSystem: 'drs',
      currentBreakpoint: "lg",
      compactType: "vertical",
      mounted: false,
      layouts: { lg: props.initialLayout },
      layout: [],
      rowHeight: window.innerWidth < 1300 ? 3.7 : 10.6,
      deletedObj: { drsRegisteredApprovedIMEIsKey: false, drsCountOfStatusKey: false, drsTopBrandsChartKey: false, drsTopModelsKey: false, drsRatTypeKey: false, drsOSTypeKey: false, drsManufacturingKey: false, drsDeviceTypeKey: false, drsTopDeviceImporterKey: false, drsInputTypeKey: false, drsNumOfSimsKey: false}
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

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
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
    this.setState({ layouts: { lg: _.reject(this.state.layout, { i: 'drsTopModelsKey' })} }, () => {
    let { deletedObj } = this.state;
    deletedObj.drsRegisteredApprovedIMEIsKey = false;
    deletedObj.drsCountOfStatusKey = false;
    deletedObj.drsTopBrandsChartKey = false;
    deletedObj.drsTopModelsKey = false;
    deletedObj.drsRatTypeKey = false;
    deletedObj.drsOSTypeKey = false;
    deletedObj.drsManufacturingKey = false;
    deletedObj.drsDeviceTypeKey = false;
    deletedObj.drsTopDeviceImporterKey = false;
    deletedObj.drsInputTypeKey = false;
    deletedObj.drsNumOfSimsKey = false;
    this.setState({ deletedObj: deletedObj, layouts: { lg: this.props.initialLayout } });
    })
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

  saveSearchQuery(values) {
    this.setState({ searchQuery: values, drsManufacturingLoading: true, drsNumOfSimsLoading: true, drsRegisteredApprovedIMEIsLoading: true, drsTopDeviceImporterLoading: true, drsInputTypeLoading: true, drsOSTypeLoading: true, drsDeviceTypeLoading: true, drsRatTypeLoading: true, drsTopBrandsLoading: true, drsTopModelsLoading: true, drsCountOfStatusLoading: true, drsManufacturingData: [], drsNumOfSimsData: [], drsRegisteredApprovedIMEIsData: [], drsTopDeviceImporterData: [], drsInputTypeData: [], drsOSTypeData: [], drsDeviceTypeData: [], drsRatTypeData: [], drsTopBrandsData: [], drsTopModelsData: [], drsCountOfStatusData: [], apiFetched: true} , () => {
      this.updateTokenHOC(this.getGraphDataFromServer);
	  })
  }
  dataFormatter = (array) => {
    let newArr= [];
    array.map(item => 
      newArr.push({"name": Object.keys(item)[0], "value":item[Object.keys(item)[0]]})
    )
  return newArr;
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

      instance.post('/drs-reg-13-main-counters',postData, config)
        .then(response => {
          const data = Object.assign({}, ...response.data.drs_boxes);
          const includeDashes = JSON.parse(JSON.stringify(data).replace(/ /g, '_'))
          this.setState({
              approved: includeDashes.Approved,
              rejected: includeDashes.Rejected,
              inReview: includeDashes.Pending_Review,
              totalRegDev: includeDashes.Total_Registered_Devices,
              smartphone: includeDashes.Smartphone,
              featPhone: includeDashes.Feature_phone
          })
          var resizeEvent = window.document.createEvent('UIEvents'); 
          resizeEvent.initUIEvent('resize', true, false, window, 0); 
          window.dispatchEvent(resizeEvent);
        })
      
      instance.post('/drs-reg-01-manufacturing_location', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ drsManufacturingLoading: false });
              } else {
                let cleanData = yAxisKeysCleaning(response.data.results)
                let uniqueLocation = getUniqueKeys(cleanData);
                this.setState({ drsManufacturingData: cleanData, uniqueLocation: uniqueLocation, drsManufacturingLoading: false, granularity: searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })
      
      instance.post('/drs-reg-02-num-of-sims', postData, config)
          .then(response => {
            let cleanData = yAxisKeysCleaning(response.data.results)
            let uniqueSims = getUniqueKeys(cleanData);
            this.setState({ drsNumOfSimsData: cleanData, uniqueSims: uniqueSims, drsNumOfSimsLoading: false, granularity: searchQuery.granularity});
          })
          .catch(error => {
              errors(this, error);
          })
      
      
      instance.post('/drs-reg-03-registered-imeis-approved', postData, config)
          .then(response => {
            let cleanData = yAxisToCount(response.data.results)
            let uniqueImie = getUniqueKeys(cleanData);
            this.setState({ drsRegisteredApprovedIMEIsData: cleanData, uniqueImie: uniqueImie, drsRegisteredApprovedIMEIsLoading: false, granularity: searchQuery.granularity});
          })
          .catch(error => {
              errors(this, error);
          })

      instance.post('/drs-reg-04-count-of-statuses', postData, config)
          .then(response => {
            let cleanData = yAxisKeysCleaning(response.data.results)
            let uniqueStatusCount = getUniqueKeys(cleanData);
            this.setState({ drsCountOfStatusData: cleanData, uniqueStatusCount: uniqueStatusCount, drsCountOfStatusLoading: false, granularity: searchQuery.granularity});
          })
          .catch(error => {
              errors(this, error);
          })  

      instance.post('/drs-reg-05-top-device-importers', postData, config)
          .then(response => {
                this.setState({ drsTopDeviceImporterData: response.data.top_importers, drsTopDeviceImporterLoading: false, granularity: searchQuery.granularity});
          })
          .catch(error => {
              errors(this, error);
          })  

      instance.post('/drs-reg-07-input-type', postData, config)
          .then(response => {
            let cleanData = yAxisKeysCleaning(response.data.results)
            let uniqueInputType = getUniqueKeys(cleanData);
            this.setState({ drsInputTypeData: cleanData,uniqueInputType: uniqueInputType, drsInputTypeLoading: false, granularity: searchQuery.granularity});
          })
          .catch(error => {
              errors(this, error);
          })
      instance.post('/drs-reg-08-os-type', postData, config)
          .then(response => {
                let cleanData = yAxisKeysCleaning(response.data.results)
                let uniqueTests = getUniqueKeys(cleanData);
                this.setState({ drsOSTypeData: cleanData, uniqueTests: uniqueTests, drsOSTypeLoading: false, granularity: searchQuery.granularity});
          })
          .catch(error => {
              errors(this, error);
          })
      instance.post('/drs-reg-09-device-type', postData, config)
          .then(response => {
                let cleanData = yAxisKeysCleaning(response.data.results)
                let uniqueType = getUniqueKeys(cleanData);
                this.setState({ drsDeviceTypeData: cleanData, uniqueType: uniqueType, drsDeviceTypeLoading: false, granularity: searchQuery.granularity});
          })
          .catch(error => {
              errors(this, error);
          })    
      instance.post('/drs-reg-10-rat-type', postData, config)
          .then(response => {
                let cleanData = yAxisKeysCleaning(response.data.results)
                let uniqueTech = getUniqueKeys(cleanData);
                this.setState({ drsRatTypeData: cleanData, uniqueTech: uniqueTech, drsRatTypeLoading: false, granularity: searchQuery.granularity});
          })
          .catch(error => {
              errors(this, error);
          })  
      instance.post('/drs-reg-11-top-brands', postData, config)
          .then(response => {
                let cleanData = yAxisKeysCleaning(response.data.results)
                let uniqueBrands = getUniqueKeys(cleanData);
                this.setState({ drsTopBrandsData: cleanData, uniqueBrands: uniqueBrands, drsTopBrandsLoading: false, granularity: searchQuery.granularity});
          })
          .catch(error => {
              errors(this, error);
          })    
      instance.post('/drs-reg-12-top-models', postData, config)
          .then(response => {
                let cleanData = yAxisKeysCleaning(response.data.results)
                let uniqueModels = getUniqueKeys(cleanData);
                this.setState({ drsTopModelsData: cleanData, uniqueModels: uniqueModels, drsTopModelsLoading: false, granularity: searchQuery.granularity});
          })
          .catch(error => {
              errors(this, error);
          })    
  }
  render() {
    const {apiFetched, drsManufacturingData, drsNumOfSimsData, drsRegisteredApprovedIMEIsData, drsTopDeviceImporterData, drsInputTypeData, drsOSTypeData, drsDeviceTypeData, drsRatTypeData, drsTopBrandsData, drsTopModelsData, drsCountOfStatusData, drsManufacturingLoading, drsNumOfSimsLoading, drsRegisteredApprovedIMEIsLoading, drsTopDeviceImporterLoading, drsInputTypeLoading, drsOSTypeLoading, drsDeviceTypeLoading, drsRatTypeLoading, drsTopBrandsLoading, drsTopModelsLoading, drsCountOfStatusLoading, uniqueTests, uniqueType, uniqueTech, uniqueBrands, uniqueModels, uniqueLocation, uniqueSims, uniqueImie, uniqueInputType, uniqueStatusCount, granularity, approved, rejected,inReview, totalRegDev, smartphone, featPhone, deletedObj } = this.state;
    return (
      <Container fluid>
        <div className="search-box animated fadeIn">
          { apiFetched &&
          <article className="overview">
            <Row>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0B6EDE" cardTitle="Registered Devices" cardText={totalRegDev}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0BD49C" cardTitle="Registered IMEIs" cardText={approved}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#ED6364" cardTitle="Rejected IMEIs" cardText={rejected}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#FEAC55" cardTitle="Pending IMEIs" cardText={inReview}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0BDDDE" cardTitle="Registered Smartphones" cardText={smartphone}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#F07C7C" cardTitle="Registered Featured Phones" cardText={featPhone}/></Col>
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
          ? 
          <React.Fragment>
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
                </article>                <div className="grid-box">
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
                    <div name='drsRegisteredApprovedIMEIsKey' key="drsRegisteredApprovedIMEIsKey" className={deletedObj.drsRegisteredApprovedIMEIsKey === true && 'hidden'}>
                    <Barchart cardClass="card-success" title="Registered IMEIs Count" loading={drsRegisteredApprovedIMEIsLoading} data={drsRegisteredApprovedIMEIsData} xAxis="x_axis" yAxisLabel="Number of IMEIs" yAxes={uniqueImie} customName="Count" colorArray={blueColors.slice(2)} granularity={granularity} info={registeredDevicesCount} showLegend="false" heightProp={this.getElementHeight(document.getElementsByName('drsRegisteredApprovedIMEIsKey')[0])} removeChart={this.onRemoveItem} chartGridId={'drsRegisteredApprovedIMEIsKey'}/>
                    </div>
                    <div name='drsCountOfStatusKey' key="drsCountOfStatusKey" className={deletedObj.drsCountOfStatusKey === true && 'hidden'}>
                    <Barchart cardClass="card-primary" title="IMEIs Registration Status" loading={drsCountOfStatusLoading} data={drsCountOfStatusData} xAxis="x_axis" yAxisLabel="Represents number of IMEIs" yAxes={uniqueStatusCount} colorArray={stackBarTwentyColors.slice(3)} granularity={granularity} info={ deviceRegistrationStatus }  heightProp={this.getElementHeight(document.getElementsByName('drsCountOfStatusKey')[0])} removeChart={this.onRemoveItem} chartGridId={'drsCountOfStatusKey'}/>
                    </div>
                    <div name='drsTopBrandsChartKey' key="drsTopBrandsChartKey" className={deletedObj.drsTopBrandsChartKey === true && 'hidden'}>
                    <Barchart cardClass="card-primary" title="Top Registered Brands" loading={drsTopBrandsLoading} data={drsTopBrandsData} xAxis="x_axis" yAxisLabel="Number of Devices" yAxes={uniqueBrands} colorArray={stackBarTwentyColors} granularity={granularity} info={topRegisteredBrands }  heightProp={this.getElementHeight(document.getElementsByName('drsTopBrandsChartKey')[0])} removeChart={this.onRemoveItem} chartGridId={'drsTopBrandsChartKey'}/>
                    </div>    
                    <div name='drsTopModelsKey' key="drsTopModelsKey" className={deletedObj.drsTopModelsKey === true && 'hidden'}>
                    <Barchart cardClass="card-success" title="Top Registered Models" loading={drsTopModelsLoading} data={drsTopModelsData} xAxis="x_axis" yAxisLabel="Number of Devices" yAxes={uniqueModels} colorArray={multiColorStack} granularity={granularity} info={topRegisteredModels}  heightProp={this.getElementHeight(document.getElementsByName('drsTopModelsKey')[0])} removeChart={this.onRemoveItem} chartGridId={'drsTopModelsKey'}/>
                    </div> 
                    <div name='drsRatTypeKey' key="drsRatTypeKey" className={deletedObj.drsRatTypeKey === true && 'hidden'}>
                    <Barchart cardClass="card-info" title="Device Technologies" loading={drsRatTypeLoading} data={drsRatTypeData} xAxis="x_axis" yAxisLabel="Number of Devices" yAxes={uniqueTech} colorArray={multiColorStack} granularity={granularity} info={deviceTechnology}  heightProp={this.getElementHeight(document.getElementsByName('drsRatTypeKey')[0])} removeChart={this.onRemoveItem} chartGridId={'drsRatTypeKey'}/>
                    </div>
                    <div name='drsOSTypeKey' key="drsOSTypeKey" className={deletedObj.drsOSTypeKey === true && 'hidden'}>
                    <Barchart cardClass="card-warning" title="Devices Operating System" loading={drsOSTypeLoading} data={drsOSTypeData} xAxis="x_axis" yAxisLabel="Number of Devices" yAxes={uniqueTests} colorArray={stackBarTwentyColors.slice(3)} granularity={granularity} info={deviceOS}  heightProp={this.getElementHeight(document.getElementsByName('drsOSTypeKey')[0])} removeChart={this.onRemoveItem} chartGridId={'drsOSTypeKey'}/>
                    </div>
                    <div name='drsManufacturingKey' key="drsManufacturingKey" className={deletedObj.drsManufacturingKey === true && 'hidden'}>
                     <Areachart cardClass="card-info" title="Devices Manufacturing Location" loading={drsManufacturingLoading} data={drsManufacturingData} xAxis="x_axis" yAxisLabel="Number of Devices" yAxes={uniqueLocation} colorArray={stackBarTetrade} granularity={granularity} info={deviceManufacturingLocation}  heightProp={this.getElementHeight(document.getElementsByName('drsManufacturingKey')[0])} removeChart={this.onRemoveItem} chartGridId={'drsManufacturingKey'}/>
                    </div>
                    <div name='drsDeviceTypeKey' key="drsDeviceTypeKey" className={deletedObj.drsDeviceTypeKey === true && 'hidden'}>
                    <Barchart cardClass="card-primary" title="Types of Registered Devices" loading={drsDeviceTypeLoading} data={drsDeviceTypeData} xAxis="x_axis" yAxisLabel="Number of Devices" yAxes={uniqueType} colorArray={multiColors} granularity={granularity} info={typeOfRegeisteredDevices }  heightProp={this.getElementHeight(document.getElementsByName('drsDeviceTypeKey')[0])} removeChart={this.onRemoveItem} chartGridId={'drsDeviceTypeKey'}/>
                    </div>
                    <div name='drsTopDeviceImporterKey' key="drsTopDeviceImporterKey" className={deletedObj.drsTopDeviceImporterKey === true && 'hidden'}>
                    <Piechart cardClass="card-warning" title="Device Top Importers" loading={drsTopDeviceImporterLoading} data={drsTopDeviceImporterData} value="value" colorArray={multiColorStack} granularity={granularity} innerRadiusProp={70} paddingProp={2} info={deviceTopImporters}  heightProp={this.getElementHeight(document.getElementsByName('drsTopDeviceImporterKey')[0])} removeChart={this.onRemoveItem} chartGridId={'drsTopDeviceImporterKey'}/>
                    </div>
                    <div name='drsInputTypeKey' key="drsInputTypeKey" className={deletedObj.drsInputTypeKey === true && 'hidden'}>
                    <Areachart cardClass="card-success" title="Device Registration Method" loading={drsInputTypeLoading} data={drsInputTypeData} xAxis="x_axis" yAxisLabel="Represents number of devices" yAxes={uniqueInputType} colorArray={BoxesColors.slice(3)} granularity={granularity} info={deviceRegistrationMethod}  heightProp={this.getElementHeight(document.getElementsByName('drsInputTypeKey')[0])} removeChart={this.onRemoveItem} chartGridId={'drsInputTypeKey'}/>
                    </div>
                    <div name='drsNumOfSimsKey' key="drsNumOfSimsKey" className={deletedObj.drsNumOfSimsKey === true && 'hidden'}>
                    <Barchart cardClass="card-info" title="Devices by IMEI Slots" loading={drsNumOfSimsLoading} data={drsNumOfSimsData} xAxis="x_axis" yAxisLabel="Number of Devices" yAxes={uniqueSims} colorArray={multiColorStack.slice(4)}  granularity={granularity} info={devicesByIMEISlot} heightProp={this.getElementHeight(document.getElementsByName('drsNumOfSimsKey')[0])} removeChart={this.onRemoveItem} chartGridId={'drsNumOfSimsKey'}/>
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
    {i: 'drsRegisteredApprovedIMEIsKey', x: 0, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'drsCountOfStatusKey', x: 50, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'drsTopBrandsChartKey', x: 0, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'drsTopModelsKey', x: 50, y: 0, w: 50, h: (50/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'drsRatTypeKey', x: 0, y: 0, w: 50, h: (50/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'drsOSTypeKey', x: 50, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'drsManufacturingKey', x: 0, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'drsDeviceTypeKey', x: 50, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'drsTopDeviceImporterKey', x: 0, y: 0, w: 50, h: (50/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6), isResizable: false },
    {i: 'drsInputTypeKey', x: 50, y: 0, w: 50, h: (50/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'drsNumOfSimsKey', x: 0, y: 0, w: 50, h: (50/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) }
  ]
};

export default Trends;
