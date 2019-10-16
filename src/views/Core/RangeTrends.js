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
import SearchForm from './../../components/Form/SearchForm';
import {unique_437_colors, getAuthHeader, instance, errors, getUniqueKeys, yAxisKeysCleaning, FormatDataForDataTable, getUserRole, getUserType, replaceCharacters, scrollOsetTopPlus, fixFilOsetHeightMinus} from "./../../utilities/helpers";
import Barchart from './../../components/Charts/Commons/Barchart';
import Linechart from './../../components/Charts/Commons/Linechart';
import DataTable from './../../components/DataTable/DataTable';
import SearchFilters from "./../../components/Form/SearchFilters";
import {SearchInfo} from "./../../components/Help/SearchInfo";
import { multiColorStack, multiColors } from './../../utilities/chart_colors';
import HeaderCards from './../../components/Cards/HeaderCards';
import { regListTopModel, topModelDetails, noOfbListIMEI, networkNotificationList, networkExceptionList } from './../../utilities/reportsInfo';
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
      isShowingFilters: true,      disableSaveButton: true,      uniqueBrands: [],
      uniqueModels: [],
      rCoreNumOfIMEIsData: null,
      rCoreNetworOpData: null,
      rCoreNetworOpNotifcationData: null,
      rCoreRegistrationData: null,
      rCoreTopModelDetailData: null,
      rCoreNumOfIMEIsLoading: false,
      rCoreNetworOpLoading: false,
      rCoreNetworOpNotifcationLoading: false,
      rCoreRegistrationLoading: false,
      rCoreTopModelDetailLoading: false,
      rCoreNetworOpHeaderData: null,
      rCoreNetworOpNotifcationHeaderData: null,
      rCoreTopModelDetailHeaderData: null,
      core6HeaderData: null,
      core10HeaderData: null,
      apiFetched: false,
      searchQuery: {},
      granularity: "",
      topModelPercentage: 0,
      totalImies: '',
      invalidImies: '',
      validImies: '',
      blacklistImies: '',
      exceptionImies: '',
      notifImies: '',
      subSystem: 'core_range',
      currentBreakpoint: "lg",
      compactType: "vertical",
      mounted: false,
      layouts: { lg: props.initialLayout },
      layout: [],
      rowHeight: window.innerWidth < 1300 ? 3.7 : 10.6,
      deletedObj: { rCoreRegistrationKey: false, rCoreTopModelDetailKey: false, rCoreNumOfIMEIsKey: false, rCoreNetworOpKey: false, rCoreNetworOpNotifcationKey: false}
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

  //In componentDidMount hook we are maximizing sidebar on page load

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
    this.setState({ layouts: { lg: _.reject(this.state.layout, { i: 'rCoreNetworOpKey' })} }, () => {
    let { deletedObj } = this.state;
    deletedObj.rCoreRegistrationKey = false;
    deletedObj.rCoreTopModelDetailKey = false;
    deletedObj.rCoreNumOfIMEIsKey = false;
    deletedObj.rCoreNetworOpKey = false;
    deletedObj.rCoreNetworOpNotifcationKey = false;
    this.setState({ deletedObj: deletedObj, layouts: { lg: this.props.initialLayout } });
    })
  }

  handleScroll() {
    this.setState({scroll: window.scrollY});
  }

//returns randomized color array from single array of colors.

  getColorArray = (n) => unique_437_colors.slice(n);

// This method check if user's token is expired, if yes, It updates it and save it in the local storage

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

  filtersSidebarDisplay = () => {
    this.showHideFilters();
    document.body.classList.add('brand-minimized');
    document.body.classList.add('sidebar-minimized');
  }


// this method set initial state of the component and being called for search component

  saveSearchQuery(values) {
    this.setState({ searchQuery: values, rCoreNumOfIMEIsLoading: true, rCoreNetworOpLoading: true, rCoreNetworOpNotifcationLoading: true, rCoreRegistrationLoading: true, rCoreTopModelDetailLoading: true, rCoreNumOfIMEIsData: [], rCoreNetworOpData: [], rCoreNetworOpNotifcationData: [], rCoreRegistrationData: [], rCoreTopModelDetailData: [], rCoreNetworOpHeaderData: [], rCoreNetworOpNotifcationHeaderData: [], rCoreTopModelDetailHeaderData: [], core6HeaderData: [], core10HeaderData: [], apiFetched: true} , () => {
      this.updateTokenHOC(this.getGraphDataFromServer);
	  })
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

  //Here we are getting parameters for our APi calls.
  getCallParams = (chart_id) => {
    const searchQuery = this.state.searchQuery;
    let type = getUserType(this.props.resources)
    let role = getUserRole(this.props.resources)
    let postData = {
      ...searchQuery,
      type,
      role,
      chart_id
    }
    return postData;
  }

  // In this method we call backend API's to get data deponding on specified search params.

  getGraphDataFromServer(config) {


      instance.post('/core-graphs', this.getCallParams('core_17'), config)
        .then(response => {
          if(response.data.core_boxes){
            const data = Object.assign({}, ...response.data.core_boxes);
            this.setState({
                totalImies: data.total_imeis,
                invalidImies: data.invalid_imeis,
                validImies: data.valid_imeis,
                blacklistImies: data.blacklisted_imeis,
                exceptionImies: data.exceptionlist_imeis,
                notifImies: data.notificationlist_imeis
            })
          }
          var resizeEvent = window.document.createEvent('UIEvents'); 
          resizeEvent.initUIEvent('resize', true, false, window, 0); 
          window.dispatchEvent(resizeEvent);
        })

//Here API is being called to get No of Blacklisted IMEIs. In response we are setting the state with the recieved data

      instance.post('/core-graphs', this.getCallParams('core_01'), config)
          .then(response => {
              if(response.data.message) {
                this.setState({ rCoreNumOfIMEIsLoading: false });
              } else {
                this.setState({ rCoreNumOfIMEIsData: response.data.results, rCoreNumOfIMEIsLoading: false, granularity: this.state.searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })

//Here API is being called to get No. of Unique IMEIs, IMSI and IMEIs_IMSI_pairs in Exceptionlist.
const exceptionListOrder = ["MNO", "UNIQUE_IMEIS", "UNIQUE_IMSIS", "IMEI_IMSI_PAIR", "TOTAL_IMEIS"];
const displayExceptionListOrder = ["Network Operator", "IMEIs", "IMSIs", "IMEI IMSI Pairs", "Total IMEIs"];

      instance.post('/core-graphs', this.getCallParams('core_02'), config)
          .then(response => {
              if(response.data.message) {
                this.setState({ rCoreNetworOpLoading: false });
              } else {
                const formatedData = FormatDataForDataTable(response.data.segregated_result, false, exceptionListOrder);
                //const reorderedData = reorderData(formatedData.content, reOrderHorizontalWiseExceptionList);
                this.setState({ rCoreNetworOpData: formatedData.content, rCoreNetworOpHeaderData: displayExceptionListOrder, rCoreNetworOpLoading: false, granularity: this.state.searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })

//Here API is being called to get No. of IMEIs/IMSI/MSISDN Pairs & Triplets in Notification List
const notificationListOrder = [
  "MNO",
  "UNIQUE_IMEIS",
  "UNIQUE_MSISDNS",
  "UNIQUE_IMSIS",
  "IMEI_IMSI_PAIRS",
  "IMEI_MSISDN_PAIRS",
  "IMSI_MSISDN_PAIRS",
  "IMEI_IMSI_MSISDN_TRIPLETS",
  "TOTAL_IMEIS",
 ];

const displayNotificationListOrder = [
  "Network Operator",
  "IMEIs",
  "IMSIs",
  "MSISDNs",
  "IMEI-IMSI Pairs",
  "IMEI-MSISDN Pairs",
  "IMSI-MSISDN Pairs",
  "IMEI-IMSI-MSISDN Triplets",
  "Total IMEIs",
 ];

          instance.post('/core-graphs', this.getCallParams('core_03'), config)
          .then(response => {
              if(response.data.message) {
                this.setState({ rCoreNetworOpNotifcationLoading: false });
              } else {
                const formatedData = FormatDataForDataTable(response.data.segregated_result, false, notificationListOrder);
                //const reorderedData = reorderData(formatedData.content, reOrderHorizontalWiseNotificationList);
                this.setState({ rCoreNetworOpNotifcationData: formatedData.content, rCoreNetworOpNotifcationHeaderData: displayNotificationListOrder, rCoreNetworOpNotifcationLoading: false, granularity: this.state.searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })


 //Here API is being called to get No. of Blacklisted IMEIs. In response we are setting the state with the recieved data         

          instance.post('/core-graphs', this.getCallParams('core_06'), config)
          .then(response => {
              if(response.data.message) {
                this.setState({ rCoreRegistrationLoading: false });
              } else {
                let cleanData = yAxisKeysCleaning(response.data.results);
                let uniqueModel = getUniqueKeys(cleanData);
                this.setState({ rCoreRegistrationData: cleanData, uniqueModels: uniqueModel, rCoreRegistrationLoading: false, granularity: this.state.searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })

  //Here API is being called to get data based on Top Model Details. In response we are setting the state with the recieved data

  const topModelDetailsOrder = ["MODEL", "MAKE", "DEVICE_TYPE", "BRAND", "RAT", "COUNT"];
  const displayTopModelDetailsOrder = ["Model", "Make", "Device Type", "Brand", "RAT", "Count"];

          instance.post('/core-graphs', this.getCallParams('core_07'), config)
          .then(response => {
              if(response.data.message) {
                this.setState({ rCoreTopModelDetailLoading: false });
              } else {
                let percentage = (_.sumBy(response.data.model_details, 'count') / response.data.total_count) * 100;
                const formatedData = FormatDataForDataTable(response.data.model_details, false, topModelDetailsOrder);
                const modifiedData = replaceCharacters(formatedData.content);
                this.setState({ rCoreTopModelDetailData: modifiedData , rCoreTopModelDetailHeaderData: displayTopModelDetailsOrder, rCoreTopModelDetailLoading: false, granularity: this.state.searchQuery.granularity, topModelPercentage: percentage.toFixed(2) });
              }
          })
          .catch(error => {
              errors(this, error);
          })


  //Here API is being called to get data based on Registration Status Details. In response we are setting the state with the recieved data

          // instance.post('/core-graphs', this.getCallParams('core_08'), config)
          // .then(response => {
          //     if(response.data.message) {
          //       this.setState({ loading6: false });
          //     } else {
          //       const formatedData = FormatDataForDataTable(response.data.status_details, false);
          //       this.setState({ core6Data: formatedData.content, core6HeaderData: formatedData.headings, loading6: false, granularity: this.state.searchQuery.granularity});
          //     }
          // })
          // .catch(error => {
          //     errors(this, error);
          // })


  }
  

  render() {
    const {apiFetched, rCoreNumOfIMEIsData, rCoreNetworOpData, rCoreNetworOpNotifcationData, rCoreRegistrationData,  rCoreTopModelDetailData, rCoreNetworOpHeaderData, rCoreNetworOpNotifcationHeaderData, rCoreTopModelDetailHeaderData, rCoreNumOfIMEIsLoading, rCoreNetworOpLoading, rCoreNetworOpNotifcationLoading, rCoreRegistrationLoading, rCoreTopModelDetailLoading, uniqueModels, granularity, totalImies, invalidImies, validImies, blacklistImies, exceptionImies, notifImies, deletedObj} = this.state;
    let topModelDetailsTitle = this.state.topModelPercentage === 0 ? <span>Top Model Details</span> : <span> Top Model Details <span className="in-header-info">(Representing {this.state.topModelPercentage}% of total count)</span></span>
    return (
      <Container fluid>
        <div className="search-box animated fadeIn">
          { apiFetched &&
          <article className="overview">
          <Row>
            <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0B6EDE" cardTitle="Unique IMEIs" cardText={totalImies}/></Col>
            <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0BD49C" cardTitle="Compliant IMEIs" cardText={validImies}/></Col>
            <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#F07C7C" cardTitle="Non Compliant IMEIs" cardText={invalidImies}/></Col>
            <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#404040" cardTitle="Black List IMEIs" cardText={blacklistImies}/></Col>
            <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#a3c592" cardTitle="Exception List IMEIs" cardText={exceptionImies}/></Col>
            <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#9c9c9c" cardTitle="Notification List IMEIs" cardText={notifImies}/></Col>
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
                  <SearchForm callServer={this.saveSearchQuery} showHideComponents={this.filtersSidebarDisplay} />
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
                  <SearchForm callServer={this.saveSearchQuery} showHideComponents={this.filtersSidebarDisplay} />
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
            {/* Here we are rendering reusable charts and passing them props according to the need. (Title, loading, data, xAxis and yAxes are the only mandatory props)   */}
                
                    <div name='rCoreRegistrationKey' key="rCoreRegistrationKey" className={deletedObj.rCoreRegistrationKey === true && 'hidden'}>
                    <Barchart cardClass="card-primary" title="Registration List Top Models by IMEI Count" loading={rCoreRegistrationLoading} data={rCoreRegistrationData} xAxis="x_axis" yAxes={uniqueModels} yAxisLabel="Number of IMEIs" colorArray={multiColors} granularity={granularity} info={regListTopModel} heightProp={this.getElementHeight(document.getElementsByName('rCoreRegistrationKey')[0])} removeChart={this.onRemoveItem} chartGridId={'rCoreRegistrationKey'}/>
                    </div>
                    <div name='rCoreTopModelDetailKey' key="rCoreTopModelDetailKey" className={deletedObj.rCoreTopModelDetailKey === true && 'hidden'}>
                    <DataTable cardClass="card-info" scrollHeight="100%" chartBoxClass="chart-box" title={topModelDetailsTitle} loading={rCoreTopModelDetailLoading} headings={rCoreTopModelDetailHeaderData} rows={rCoreTopModelDetailData}  granularity={granularity} info={topModelDetails} heightProp={this.getElementHeight(document.getElementsByName('rCoreTopModelDetailKey')[0])} removeChart={this.onRemoveItem} chartGridId={'rCoreTopModelDetailKey'}/>
                    </div>
                    <div name='rCoreNumOfIMEIsKey' key="rCoreNumOfIMEIsKey" className={deletedObj.rCoreNumOfIMEIsKey === true && 'hidden'}>
                    <Linechart cardClass="card-danger" title="Number of IMEIs in Black List" loading={rCoreNumOfIMEIsLoading} data={rCoreNumOfIMEIsData} xAxis="x_axis" yAxisLabel="Number of IMEIs" yAxes={["y_axis"]} customName="Count" colorArray={multiColorStack.slice(3)} granularity={granularity} info={noOfbListIMEI} showLegend="false" heightProp={this.getElementHeight(document.getElementsByName('rCoreNumOfIMEIsKey')[0])} removeChart={this.onRemoveItem} chartGridId={'rCoreNumOfIMEIsKey'}/>
                    </div>    
                    <div name='rCoreNetworOpKey' key="rCoreNetworOpKey" className={deletedObj.rCoreNetworOpKey === true && 'hidden'}>
                    <DataTable cardClass="card-warning" chartBoxClass="chart-box" scrollHeight="auto" title="Network Operator Exception List Stats" loading={rCoreNetworOpLoading} headings={rCoreNetworOpHeaderData} rows={rCoreNetworOpData} granularity={granularity} info={networkExceptionList} heightProp={this.getElementHeight(document.getElementsByName('rCoreNetworOpKey')[0])} removeChart={this.onRemoveItem} chartGridId={'rCoreNetworOpKey'}/>
                    </div> 
                    <div name='rCoreNetworOpNotifcationKey' key="rCoreNetworOpNotifcationKey" className={deletedObj.rCoreNetworOpNotifcationKey === true && 'hidden'}>
                    <DataTable cardClass="card-info" scrollHeight="auto" title="Network Operator Notification List Stats" loading={rCoreNetworOpNotifcationLoading} headings={rCoreNetworOpNotifcationHeaderData} rows={rCoreNetworOpNotifcationData}  granularity={granularity} info={networkNotificationList} heightProp={this.getElementHeight(document.getElementsByName('rCoreNetworOpNotifcationKey')[0])} removeChart={this.onRemoveItem} chartGridId={'rCoreNetworOpNotifcationKey'}/>
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
    {i: 'rCoreRegistrationKey', x: 0, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'rCoreTopModelDetailKey', x: 50, y: 0, w: 50, h: (50 /100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'rCoreNumOfIMEIsKey', x: 0, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'rCoreNetworOpKey', x: 50, y: 0, w: 50, h: (50/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'rCoreNetworOpNotifcationKey', x: 0, y: 5, w: 100, h: (40/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
  ]
};


export default Trends;