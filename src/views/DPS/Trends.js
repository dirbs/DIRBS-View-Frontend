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
import {unique_437_colors, getAuthHeader, instance, errors, getUniqueKeys, yAxisKeysCleaning, FormatDataForDataTable, getUserRole, getUserType, secondaryPrimary, scrollOsetTopPlus, fixFilOsetHeightMinus} from "./../../utilities/helpers";
import Barchart from './../../components/Charts/Commons/Barchart';
import Linechart from './../../components/Charts/Commons/Linechart';
import DataTable from './../../components/DataTable/DataTable';
import SearchFilters from "./../../components/Form/SearchFilters";
import {SearchInfo} from "./../../components/Help/SearchInfo";
import { blueColors, StackColorsSkin, StackColorsCombination, multiColorStack} from './../../utilities/chart_colors';
import HeaderCards from './../../components/Cards/HeaderCards';
import { numberOfPermanentPairs, topModelsbyPairedDevices, numOfDevicesPaired, topBrandByPairedDevices, numberofPairsCreatedByType, numberofPairsDeletedByType, devicePairedByTech, noOfSimChanged, identifierStatsByNetwork } from './../../utilities/reportsInfo';
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
      topBrands: [],
      allTech: [],
      uniqueActivePVS: [],
      uniqueActivePairs: [],
      uniqueDeletedPairs: [],
      dpsTopBrandsData: null,
      dpsTopModelsData: null,
      dpsRatTypesData: null,
      dpsActivePSPairsData: null,
      dpsDeletedPSPairsData: null,
      dpsNoOfConnectionsData: null,
      dpsNoOfDevicesData: null,
      dpsTotalCreatedPairsData: null,
      dpsTotalDeletedPairsData: null,
      dpsTotalPermanentPairsData: null,
      dpsUniquePairsTripletsData: null,
      dpsTopBrandsLoading: false,
      dpsTopModelsLoading: false,
      dpsRatTypesLoading: false,
      dpsActivePSPairsLoading: false,
      dpsDeletedPSPairsLoading: false,
      dpsNoOfConnectionsLoading: false,
      dpsNoOfDevicesLoading: false,
      dpsTotalCreatedPairsLoading: false,
      dpsTotalDeletedPairsLoading: false,
      dpsTotalPermanentPairsLoading: false,
      dpsUniquePairsTripletsLoading: false,
      dpsUniquePairsTripletsHeaderData: null,
      apiFetched: false,
      searchQuery: {},
      color:null,
      granularity: "",
      imei_imsi_pairs: '',
      imei_msisdn_pairs: '',
      unique_devices : '',
      unique_imeis: '',
      unique_imsis: '',
      unique_msisdns: '',
      subSystem: 'dps',
      currentBreakpoint: "lg",
      compactType: "vertical",
      mounted: false,
      layouts: { lg: props.initialLayout },
      layout: [],
      rowHeight: window.innerWidth < 1300 ? 3.7 : 10.6,
      deletedObj: { dpsTotalPermanentPairsKey: false, dpsNoOfDevicesKey: false, dpsTopBrandsKey: false, dpsTopModelsKey: false, dpsActivePSPairsKey: false, dpsDeletedPSPairsKey: false, dpsRatTypesKey: false, dpsNoOfConnectionsKey: false, dpsUniquePairsTripletsKey: false}
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

  getElementHeight = (dpsActivePSPairsKey) => {
    if (dpsActivePSPairsKey) {
      return dpsActivePSPairsKey.offsetHeight - 70;
    }
    return 400
  }

   resetChartConfig()
   {
    this.setState({fading: true})
    this.change = setTimeout(() => {
      this.setState({fading: false})
    }, 2000);
    this.setState({ layouts: { lg: _.reject(this.state.layout, { i: 'dpsTopModelsKey' })} }, () => {
    let { deletedObj } = this.state;
    deletedObj.dpsTotalPermanentPairsKey = false;
    deletedObj.dpsNoOfDevicesKey = false;
    deletedObj.dpsTopBrandsKey = false;
    deletedObj.dpsTopModelsKey = false;
    deletedObj.dpsActivePSPairsKey = false;
    deletedObj.dpsDeletedPSPairsKey = false;
    deletedObj.dpsRatTypesKey = false;
    deletedObj.dpsNoOfConnectionsKey = false;
    deletedObj.dpsUniquePairsTripletsKey = false;
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

// this method set initial state of the component and being called for search component

  saveSearchQuery(values) {
    this.setState({ searchQuery: values, dpsTopBrandsLoading: true, dpsTopModelsLoading: true, dpsRatTypesLoading: true, dpsActivePSPairsLoading: true, dpsDeletedPSPairsLoading: true, dpsNoOfConnectionsLoading: true, dpsNoOfDevicesLoading: true, dpsTotalCreatedPairsLoading: true, dpsTotalDeletedPairsLoading: true, dpsTotalPermanentPairsLoading: true, dpsUniquePairsTripletsLoading: true, dpsTopBrandsData: [], drs2Data: [], dpsRatTypesData: [], dpsActivePSPairsData: [], dpsDeletedPSPairsData: [], dpsNoOfConnectionsData: [], dpsNoOfDevicesData: [], dpsTotalCreatedPairsData: [], dpsTotalDeletedPairsData: [], dpsTotalPermanentPairsData: [], dpsUniquePairsTripletsData: [], dpsUniquePairsTripletsHeaderData: [], apiFetched: true} , () => {
      this.updateTokenHOC(this.getGraphDataFromServer);
	  })
  }

  // In this method we call backend API's to get data deponding on specified search params.

  getGraphDataFromServer(config) {
      const searchQuery = this.state.searchQuery;
      let type = getUserType(this.props.resources)
      let role = getUserRole(this.props.resources)
      let postData = {
        ...searchQuery,
        type,
        role
      }

      instance.post('/dps-11-main-counters',postData, config)
        .then(response => {
          if(response.data.dps_boxes){
          const data =  Object.assign({}, ...response.data.dps_boxes);
           this.setState({
            imei_imsi_pairs : data.imei_imsi_pairs,
            imei_msisdn_pairs: data.imei_msisdn_pairs,
            unique_devices: data.unique_devices,
            unique_imeis: data.unique_imeis,
            unique_imsis: data.unique_imsis,
            unique_msisdns: data.unique_msisdns

          }) 
        }
        var resizeEvent = window.document.createEvent('UIEvents'); 
        resizeEvent.initUIEvent('resize', true, false, window, 0); 
        window.dispatchEvent(resizeEvent);
        })

//Here API is being called to get Top paired brands data. In response we are setting the state with the recieved data

      instance.post('/dps-01-top-brands', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ dpsTopBrandsLoading: false });
              } else {
                let cleanData = yAxisKeysCleaning(response.data.results);
                let topBrand = getUniqueKeys(cleanData);
                this.setState({ dpsTopBrandsData: cleanData, topBrands: topBrand, dpsTopBrandsLoading: false, granularity: searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })

//Here API is being called to get Top paired mdoels data. In response we are setting the state with the recieved data

      instance.post('/dps-02-top-models', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ dpsTopModelsLoading: false });
              } else {
                let colors = this.getColorArray(1)
              
                let cleanData = yAxisKeysCleaning(response.data.results);
                let uniqueModels = getUniqueKeys(cleanData);
                this.setState({ dpsTopModelsData: cleanData, uniqueModels: uniqueModels, dpsTopModelsLoading: false, color:colors, granularity: searchQuery.granularity});
         }
          })
          .catch(error => {
              errors(this, error);
          })

//Here API is being called to get number of devices based on thier technology (2G/3G/4G). In response we are setting the state with the recieved data

          instance.post('/dps-03-rat-types', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ dpsRatTypesLoading: false });
              } else {
                let cleanData = yAxisKeysCleaning(response.data.results);
                let techs = getUniqueKeys(cleanData);
                this.setState({ dpsRatTypesData: cleanData, allTech: techs, dpsRatTypesLoading: false, granularity: searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })


 //Here API is being called to get data for primary and secondary pairs. In response we are setting the state with the recieved data         

          instance.post('/dps-04a-active-primary-secondary-pairs', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ dpsActivePSPairsLoading: false });
              } else {
                let cleanData = secondaryPrimary(response.data.results);
                let uniqueActivePairs = getUniqueKeys(cleanData);
                this.setState({ dpsActivePSPairsData: cleanData, dpsActivePSPairsLoading: false, uniqueActivePairs: uniqueActivePairs, granularity: searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })

 //Here API is being called to get data for primary and secondary pairs. In response we are setting the state with the recieved data         

          instance.post('/dps-04b-deleted-primary-secondary-pairs', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ dpsDeletedPSPairsLoading: false });
              } else {
                let cleanData = secondaryPrimary(response.data.results);
                let uniqueDeletedPairs = getUniqueKeys(cleanData);
                this.setState({ dpsDeletedPSPairsData: cleanData, dpsDeletedPSPairsLoading: false, uniqueDeletedPairs: uniqueDeletedPairs, granularity: searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })

  //Here API is being called to get data based on number of IMSI and MSISDN. In response we are setting the state with the recieved data

          instance.post('/dps-05-num-of-connections', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ dpsNoOfConnectionsLoading: false });
              } else {
                let cleanData = yAxisKeysCleaning(response.data.results);
                this.setState({ dpsNoOfConnectionsData: cleanData, dpsNoOfConnectionsLoading: false, granularity: searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })

  //Here API is being called to get data for number of devices. In response we are setting the state with the recieved data

          instance.post('/dps-06-num-of-devices', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ dpsNoOfDevicesLoading: false });
              } else {
                let cleanData = yAxisKeysCleaning(response.data.results);
                this.setState({ dpsNoOfDevicesData: cleanData, dpsNoOfDevicesLoading: false, granularity: searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })

  //Here API is being called to get data showing total number of pairs created. In response we are setting the state with the recieved data

          instance.post('/dps-07-total-created-pairs', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ dpsTotalCreatedPairsLoading: false });
              } else {
                this.setState({ dpsTotalCreatedPairsData: response.data.results, dpsTotalCreatedPairsLoading: false, granularity: searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })

  //Here API is being called to get data showing total number of pairs deleted. In response we are setting the state with the recieved data

          instance.post('/dps-08-total-deleted-pairs', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ dpsTotalDeletedPairsLoading: false });
              } else {
                this.setState({ dpsTotalDeletedPairsData: response.data.results, dpsTotalDeletedPairsLoading: false, granularity: searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })

  //Here API is being called to get data showing total number of permanent pairs. In response we are setting the state with the recieved data

          instance.post('/dps-09-total-permanent-pairs', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ dpsTotalPermanentPairsLoading: false });
              } else {
                this.setState({ dpsTotalPermanentPairsData: response.data.results, dpsTotalPermanentPairsLoading: false, granularity: searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })

  //Here API is being called to get MNO wise unique pairs and triplets. In response we are setting the state with the recieved data
  const UniquePairsAndTripletsOrder = [
    "MNO",
    "UNIQUE_IMEIS",
    "UNIQUE_IMSIS",
    "UNIQUE_MSISDNS",
    "IMEI_IMSI_PAIRS",
    "IMEI_MSISDN_PAIRS",
    "IMSI_MSISDN_PAIRS",
    "IMEI_IMSI_MSISDN_TRIPLETS",
   ];

  const displayUniquePairsAndTripletsOrder = [
    "Network Operator",
    "Devices (IMEIs)",
    "Subscribers (IMSIs)",
    "Connections (MSISDNs)",
    "IMEI-IMSI Pair",
    "IMEI-MSISDN Pair",
    "IMSI-MSISDN Pair",
    "Triplets (IMEI-IMSI-MSISDN)",
   ];

          instance.post('/dps-10-unique-pairs-triplets', postData, config)
          .then(response => {
              if(response.data.message) {
                this.setState({ dpsUniquePairsTripletsLoading: false });
              } else {
                const formatedData = FormatDataForDataTable(response.data.results, false, UniquePairsAndTripletsOrder);
                //const reorderedData = reorderData(formatedData.content, reOrderHorizontalWiseUniquePairs);
                this.setState({ dpsUniquePairsTripletsData: formatedData.content, dpsUniquePairsTripletsHeaderData: displayUniquePairsAndTripletsOrder, dpsUniquePairsTripletsLoading: false, granularity: searchQuery.granularity});
              }
          })
          .catch(error => {
              errors(this, error);
          })
      
  }

  render() {
    const {apiFetched, dpsTopBrandsData, dpsTopModelsData, dpsRatTypesData, dpsActivePSPairsData, dpsDeletedPSPairsData,  dpsNoOfConnectionsData,  dpsNoOfDevicesData, dpsTotalPermanentPairsData, dpsUniquePairsTripletsData, dpsUniquePairsTripletsHeaderData, dpsTopBrandsLoading, dpsTopModelsLoading, dpsRatTypesLoading, dpsActivePSPairsLoading, dpsDeletedPSPairsLoading, dpsNoOfConnectionsLoading, dpsNoOfDevicesLoading, dpsTotalPermanentPairsLoading, dpsUniquePairsTripletsLoading, uniqueModels, topBrands, allTech, uniqueActivePairs, uniqueDeletedPairs, granularity, unique_devices, unique_imeis, unique_imsis, unique_msisdns, imei_imsi_pairs, imei_msisdn_pairs, deletedObj} = this.state;
    let countPrimarySecondaryExcluding = <span> Pairs Created <span className="in-header-info">(Primary & Secondary)</span></span>
    let countPrimarySecondaryDeleted = <span> Pairs Deleted <span className="in-header-info">(Primary & Secondary)</span></span>
    return (
      <Container fluid>
        <div className="search-box animated fadeIn">
          { apiFetched &&
          <article className="overview">
            <Row>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0B6EDE" cardTitle="Paired Devices" cardText={unique_devices}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0BD49C" cardTitle="Paired IMEIs" cardText={unique_imeis}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0BDDDE" cardTitle="Paired IMSIs" cardText={unique_imsis}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0B6EDE" cardTitle="Paired MSISDNs" cardText={unique_msisdns}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#FEAC55" cardTitle="IMEI-IMSI Pairs" cardText={imei_imsi_pairs}/></Col>
              <Col xl={2} lg={3} md={4} sm={6}><HeaderCards backgroundColor="#0BDDDE" cardTitle="IMEI-MSISDNs Pairs" cardText={imei_msisdn_pairs}/></Col>
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
                  <div id="searchFormDiv" className="dps-form" style={{"display": "block"}}>
                    <DateSearchForm callServer={this.saveSearchQuery} showHideComponents={this.filtersSidebarDisplay} isMNORequired={true} />
                  </div>
                  <div style={{"display": "block"}}>
                    <SearchFilters filters={this.state.searchQuery}  />
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
                  <div id="searchFormDiv" className="dps-form" style={{"display": "block"}}>
                    <DateSearchForm callServer={this.saveSearchQuery} showHideComponents={this.filtersSidebarDisplay} isMNORequired={true} />
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
          <SearchInfo  />
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
                    <div name='dpsTotalPermanentPairsKey' key="dpsTotalPermanentPairsKey" className={deletedObj.dpsTotalPermanentPairsKey === true && 'hidden'}>
                    <Linechart cardClass="card-success" title="Number of Permanent Pairs" loading={dpsTotalPermanentPairsLoading} data={dpsTotalPermanentPairsData} xAxis="x_axis" yAxisLabel="Count of pairs" yAxes={["y_axis"]} customName="Count" colorArray={StackColorsCombination.slice(5)} granularity={granularity} info={numberOfPermanentPairs} showLegend="false"  heightProp={this.getElementHeight(document.getElementsByName('dpsTotalPermanentPairsKey')[0])} removeChart={this.onRemoveItem} chartGridId={'dpsTotalPermanentPairsKey'}/>
                    </div>
                    <div name='dpsNoOfDevicesKey' key="dpsNoOfDevicesKey" className={deletedObj.dpsNoOfDevicesKey === true && 'hidden'}>
                    <Linechart cardClass="card-primary" title="Number of Devices Paired " loading={dpsNoOfDevicesLoading} data={dpsNoOfDevicesData} xAxis="x_axis" yAxisLabel="Total count of devices" yAxes={["devices"]} colorArray={StackColorsSkin} granularity={granularity} info={numOfDevicesPaired}  showLegend="false" heightProp={this.getElementHeight(document.getElementsByName('dpsNoOfDevicesKey')[0])} removeChart={this.onRemoveItem} chartGridId={'dpsNoOfDevicesKey'}/>
                    </div>
                    <div name='dpsTopBrandsKey' key="dpsTopBrandsKey" className={deletedObj.dpsTopBrandsKey === true && 'hidden'}>
                    <Barchart cardClass="card-info" title="Top Paired Brands" loading={dpsTopBrandsLoading} data={dpsTopBrandsData} xAxis="x_axis" yAxisLabel="Number of Devices" yAxes={topBrands} colorArray={multiColorStack} granularity={granularity} info={topBrandByPairedDevices}  heightProp={this.getElementHeight(document.getElementsByName('dpsTopBrandsKey')[0])} removeChart={this.onRemoveItem} chartGridId={'dpsTopBrandsKey'}/>
                    </div>    
                    <div name='dpsTopModelsKey' key="dpsTopModelsKey" className={deletedObj.dpsTopModelsKey === true && 'hidden'}>
                    <Barchart cardClass="card-warning" title="Top Paired Models" loading={dpsTopModelsLoading} data={dpsTopModelsData} xAxis="x_axis" yAxisLabel="Number of Devices" yAxes={uniqueModels} colorArray={multiColorStack} granularity={granularity} info={topModelsbyPairedDevices}  heightProp={this.getElementHeight(document.getElementsByName('dpsTopModelsKey')[0])} removeChart={this.onRemoveItem} chartGridId={'dpsTopModelsKey'}/>
                    </div> 
                    <div name='dpsActivePSPairsKey' key="dpsActivePSPairsKey" className={deletedObj.dpsActivePSPairsKey === true && 'hidden'}>
                    <Barchart cardClass="card-info" title={countPrimarySecondaryExcluding} loading={dpsActivePSPairsLoading} data={dpsActivePSPairsData} xAxis="x_axis" yAxisLabel="Count of Pairs" yAxes={uniqueActivePairs} colorArray={blueColors} granularity={granularity} info={numberofPairsCreatedByType}  heightProp={this.getElementHeight(document.getElementsByName('dpsActivePSPairsKey')[0])} removeChart={this.onRemoveItem} chartGridId={'dpsActivePSPairsKey'}/>
                    </div>
                    <div name='dpsDeletedPSPairsKey' key="dpsDeletedPSPairsKey" className={deletedObj.dpsDeletedPSPairsKey === true && 'hidden'}>
                    <Barchart cardClass="card-danger" title={countPrimarySecondaryDeleted} loading={dpsDeletedPSPairsLoading} data={dpsDeletedPSPairsData} xAxis="x_axis" yAxisLabel="Count of Pairs" yAxes={uniqueDeletedPairs} colorArray={blueColors} granularity={granularity} info={numberofPairsDeletedByType} heightProp={this.getElementHeight(document.getElementsByName('dpsDeletedPSPairsKey')[0])} removeChart={this.onRemoveItem} chartGridId={'dpsDeletedPSPairsKey'}/>
                    </div>
                    <div name='dpsRatTypesKey' key="dpsRatTypesKey" className={deletedObj.dpsRatTypesKey === true && 'hidden'}>
                    <Barchart cardClass="card-warning" title="Paired-Devices by Radio Access Technology" loading={dpsRatTypesLoading} data={dpsRatTypesData} xAxis="x_axis" yAxisLabel="Count of Pairs" yAxes={allTech} colorArray={multiColorStack} granularity={granularity} info={devicePairedByTech}  heightProp={this.getElementHeight(document.getElementsByName('dpsRatTypesKey')[0])} removeChart={this.onRemoveItem} chartGridId={'dpsRatTypesKey'}/>
                    </div>
                    <div name='dpsNoOfConnectionsKey' key="dpsNoOfConnectionsKey" className={deletedObj.dpsNoOfConnectionsKey === true && 'hidden'}>
                    <Barchart cardClass="card-success" title="Number of SIM Change Observed by Connections" loading={dpsNoOfConnectionsLoading} data={dpsNoOfConnectionsData} xAxis="x_axis" yAxisLabel="Count of IMSI & MSISDN" yAxes={["imsi", "msisdn"]} colorArray={multiColorStack.slice(12)} granularity={granularity} info={noOfSimChanged} heightProp={this.getElementHeight(document.getElementsByName('dpsNoOfConnectionsKey')[0])} removeChart={this.onRemoveItem} chartGridId={'dpsNoOfConnectionsKey'}/>
                    </div>
                    <div name='dpsUniquePairsTripletsKey' key="dpsUniquePairsTripletsKey" className={deletedObj.dpsUniquePairsTripletsKey === true && 'hidden'}>
                    <DataTable cardClass="card-warning" scrollHeight="auto" title="Identifier Count by Network Operator" loading={dpsUniquePairsTripletsLoading} headings={dpsUniquePairsTripletsHeaderData} rows={dpsUniquePairsTripletsData} granularity={granularity} info={identifierStatsByNetwork}  heightProp={this.getElementHeight(document.getElementsByName('dpsUniquePairsTripletsKey')[0])} removeChart={this.onRemoveItem} chartGridId={'dpsUniquePairsTripletsKey'}/>
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
    {i: 'dpsTotalPermanentPairsKey', x: 0, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'dpsNoOfDevicesKey', x: 50, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'dpsTopBrandsKey', x: 0, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'dpsTopModelsKey', x: 50, y: 0, w: 50, h: (50/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'dpsActivePSPairsKey', x: 0, y: 0, w: 50, h: (50/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'dpsDeletedPSPairsKey', x: 50, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'dpsRatTypesKey', x: 0, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'dpsNoOfConnectionsKey', x: 50, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'dpsUniquePairsTripletsKey', x: 0, y: 50, w: 100, h: 20 , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
  ]
};

export default Trends;