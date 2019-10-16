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
import { unique_437_colors, getAuthHeader, instance, errors, FormatDataForDataTable, getUserType, getUserRole, reorderData, verticleDataTableFormat, ConditionalBreakdownFormat, scrollOsetTopPlus, fixFilOsetHeightMinus } from "./../../utilities/helpers";
import Piechart from './../../components/Charts/Commons/Piechart';
import Linechart from './../../components/Charts/Commons/Linechart';
import HorizontalBarSegregateChart from './../../components/Charts/Commons/HorizontalBarSegregateChart';
import DataTable from './../../components/DataTable/DataTable';
import ComplianceBreakdownTable from './../../components/DataTable/ComplianceBreakdownTable';
import SearchFilters from "./../../components/Form/SearchFilters";
import {SearchInfo} from "./../../components/Help/SearchInfo";
import HeaderCards from './../../components/Cards/HeaderCards';
import { conditionalBreakdown, IdentifierCount, IdentifierTrends, IdentifierTrendsOfUnique, complianceBreakdown, nationalBlacklist, lostStolenIMEIOnNetwork, operatorWiseReason, conditionalBreakDownIMEI, nationalBlacklistByMNO } from './../../utilities/reportsInfo';
import { blueShadsColors, BoxesColors } from './../../utilities/chart_colors'
import svgSymbol from './../../images/svg_symbol.svg';
import moment from "moment";
import { Date_Format } from './../../utilities/constants';
import { Responsive, WidthProvider } from "react-grid-layout";
import _ from 'lodash';
const ResponsiveReactGridLayout = WidthProvider(Responsive);

class MonthYearTrends extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      active: false,
      fading: false,
      isShowingFilters: true,      disableSaveButton: true,
      uniqueModels: [],
      mCoreIdentifierCountData: null,
      mCoreIdentifierTrendUniqueData: null,
      mCoreLostStolenIMEIData: null,
      mCoreBlacklistedData: null,
      mCoreBlacklistViolationData: null,
      mCoreViolationBySeletedData: null,
      mCoreComplianceBreakdownData: null,
      mCoreIdentifierTrendsData: null,
      mCoreClassificationData: null,
      mCoreConditionsBreakdownData: null,
      mCoreIdentifierCountLoading: false,
      mCoreIdentifierTrendUniqueLoading: false,
      mCoreLostStolenIMEILoading: false,
      mCoreBlacklistedLoading: false,
      mCoreBlacklistViolationLoading: false,
      mCoreViolationBySeletedLoading: false,
      mCoreComplianceBreakdownLoading: false,
      mCoreIdentifierTrendLoading: false,
      mCoreClassificationLoading: false,
      mCoreConditionsBreakdownLoading: false,
      mCoreIdentifierCountHeaderData: null,
      core2HeaderData: null,
      mCoreBlacklistedHeaderData: null,
      mCoreComplianceBreakdownHeaderData: null,
      mCoreClassificationHeaderData: null,
      uniqueNetworks: [],
      apiFetched: false,
      searchQuery: {},
      granularity: "",
      totalImies: '',
      invalidImies: '',
      validImies: '',
      blacklistImies: '',
      exceptionImies: '',
      notifImies: '',
      subSystem: 'core_monthly',
      currentBreakpoint: "lg",
      compactType: "vertical",
      mounted: false,
      layouts: { lg: props.initialLayout },
      layout: [],
      rowHeight: window.innerWidth < 1300 ? 3.7 : 10.6,
      deletedObj: { mCoreIdentifierCountKey: false, mCoreIdentifierTrendUniqueKey: false, mCoreComplianceBreakdownKey: false, mCoreIdentifierTrendsKey: false, mCoreBlacklistViolationKey: false, mCoreLostStolenIMEIKey: false, mCoreBlacklistedKey: false, mCoreViolationBySeletedKey: false, mCoreConditionsBreakdownKey: false, mCoreClassificationKey: false}
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
    this.setState({ layouts: { lg: _.reject(this.state.layout, { i: 'mCoreIdentifierTrendsKey' })} }, () => {
      let { deletedObj } = this.state;
      deletedObj.mCoreIdentifierCountKey = false;
      deletedObj.mCoreIdentifierTrendUniqueKey = false;
      deletedObj.mCoreComplianceBreakdownKey = false;
      deletedObj.mCoreIdentifierTrendsKey = false;
      deletedObj.mCoreBlacklistViolationKey = false;
      deletedObj.mCoreLostStolenIMEIKey = false;
      deletedObj.mCoreBlacklistedKey = false;
      deletedObj.mCoreViolationBySeletedKey = false;
      deletedObj.mCoreConditionsBreakdownKey = false;
      deletedObj.mCoreClassificationKey = false;
      this.setState({ layouts: { lg: this.props.initialLayout , deletedObj: deletedObj } });
    })
  }


  handleScroll() {
    this.setState({ scroll: window.scrollY });
  }

  //returns randomized color array from single array of colors.

  getColorArray = (n) => unique_437_colors.slice(n);

  // This method check if user's token is expired, if yes, It updates it and save it in the local storage

  updateTokenHOC(callingFunc) {
    let config = null;
    if (this.props.kc.isTokenExpired(0)) {
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

  showHideFilters = () => {
    const div = document.getElementById('searchFormDiv');
    if (this.state.isShowingFilters) {
      div.style.display = 'none';
    }
    else if (!this.state.isShowingFilters) {
      div.style.display = 'block';
    }
    this.setState((prevState) => ({
      isShowingFilters: !prevState.isShowingFilters
    }));
  }

  // this method set initial state of the component and being called for search component

  saveSearchQuery(values) {
    this.setState({ searchQuery: values, mCoreIdentifierCountLoading: true, mCoreIdentifierTrendUniqueLoading: true, mCoreLostStolenIMEILoading: true, mCoreBlacklistedLoading: true, mCoreBlacklistViolationLoading: true, mCoreViolationBySeletedLoading: true, mCoreComplianceBreakdownLoading: true, mCoreIdentifierTrendLoading: true, mCoreClassificationLoading: true, mCoreConditionsBreakdownLoading: true, mCoreIdentifierCountData: [], mCoreIdentifierTrendUniqueData: [], mCoreLostStolenIMEIData: [], mCoreBlacklistedData: [], mCoreBlacklistViolationData: [], mCoreViolationBySeletedData: [], mCoreComplianceBreakdownData: [], mCoreIdentifierTrendsData: [], mCoreClassificationData: [], mCoreConditionsBreakdownData: [], mCoreIdentifierCountHeaderData: [], core2HeaderData: [], mCoreBlacklistedHeaderData: [], mCoreComplianceBreakdownHeaderData: [], mCoreClassificationHeaderData: [], apiFetched: true }, () => {
      this.updateTokenHOC(this.getGraphDataFromServer);
    })
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

    const orderArrIdentifierCounts = [
      "unique_imeis",
      "unique_msisdns",
      "unique_imsis",
      "imei_imsi_pairs",
      "imei_msisdn_pairs",
      "imsi_msisdn_pairs",
      "imei_imsi_msisdn_triplets",
      "total_imeis",
     ];

    const replaceArrIdentifierCounts = [
      "Devices (non-empty IMEI count)",
      "Subscribers (non-empty MSISDN count)",
      "Connections (non-empty IMSI count)",
      "IMEI-IMSI pairs (IMEI/IMSI combinations where both are non-empty)",
      "IMEI-MSISDN pairs (IMEI/MSISDN combinations where both are non-empty)",
      "IMSI-MSISDN pairs (IMSI/MSISDN combinations where both are non-empty)",
      "Triplets (IMEI/IMSI/MSISDN combinations where all are non-empty)",
      "Total IMEIs",
     ];

    instance.post('/core-graphs', this.getCallParams('core_04'), config)
      .then(response => {
        if (response.data.message) {
          this.setState({ mCoreIdentifierCountLoading: false });
        } else {
          const formatedData = verticleDataTableFormat([response.data]);
          const reorderedData = reorderData(formatedData, orderArrIdentifierCounts, replaceArrIdentifierCounts);
          this.setState({ mCoreIdentifierCountData: reorderedData, mCoreIdentifierCountHeaderData: ["Identifier", "Count"], mCoreIdentifierCountLoading: false, granularity: this.state.searchQuery.granularity });
        }
      })
      .catch(error => {
        errors(this, error);
      })

    //Here API is being called to get No. of Unique IMEIs, IMSI and IMEIs_IMSI_pairs in Exceptionlist.

    instance.post('/core-graphs', this.getCallParams('core_05'), config)
      .then(response => {
        if (response.data.message) {
          this.setState({ mCoreIdentifierTrendUniqueLoading: false });
        } else {
          this.setState({ mCoreIdentifierTrendUniqueData: response.data.monthly_results, mCoreIdentifierTrendUniqueLoading: false, granularity: this.state.searchQuery.granularity });
        }
      })
      .catch(error => {
        errors(this, error);
      })

    //Here API is being called to get No. of stolen/lost imeis reported in lsds seen on network.

    instance.post('/core-graphs', this.getCallParams('core_09'), config)
      .then(response => {
        if (response.data.message) {
          this.setState({ mCoreLostStolenIMEILoading: false });
        } else {
          this.setState({ mCoreLostStolenIMEIData: response.data.results, mCoreLostStolenIMEILoading: false, granularity: this.state.searchQuery.granularity });
        }
      })
      .catch(error => {
        errors(this, error);
      })

    //Here API is being called to get Count of all black_list reasons for imeis seen on network per MNO.
    const orderArrBlackListed = [
      "MNO",
      "GSMA_INVALID_IMEIS",
      "LOST_STOLEN_IMEIS",
      "MALFORMED_IMEIS",
      "DUPLICATED_IMEIS",
      "UNREGISTERED_IMEIS",
      "TOTAL_IMEI",
     ];

    const displayBlackListed = [
      "Network Operator",
      "GSMA Invalid_IMEIs",
      "Lost Stolen IMEIs",
      "Malformed IMEIs",
      "Duplicated IMEIs",
      "Unregeistered IMEIs",
      "Total IMEI",
     ];

    instance.post('/core-graphs', this.getCallParams('core_10'), config)
      .then(response => {
        if (response.data.message) {
          this.setState({ mCoreBlacklistedLoading: false });
        } else {
          const formatedData = FormatDataForDataTable(response.data.results, false, orderArrBlackListed);
          //const reorderedData = reorderData(formatedData.content, reOrderHorizontalWiseBlackList)
          this.setState({ mCoreBlacklistedData: formatedData.content, mCoreBlacklistedHeaderData: displayBlackListed, mCoreBlacklistedLoading: false, granularity: this.state.searchQuery.granularity });
        }
      })
      .catch(error => {
        errors(this, error);
      })

    //Here API is being called to get Count of nationwide blacklist violations segregated by day-ranges.

    instance.post('/core-graphs', this.getCallParams('core_11'), config)
      .then(response => {
        if (response.data.message) {
          this.setState({ mCoreBlacklistViolationLoading: false });
        } else {
          this.setState({ mCoreBlacklistViolationData: response.data.day_ranges, mCoreBlacklistViolationLoading: false, granularity: this.state.searchQuery.granularity });
        }
      })
      .catch(error => {
        errors(this, error);
      })

    //Here API is being called to get Count of Operator wise blacklist violations segregated.
      if(this.state.searchQuery.mno !== "all")
      {
    instance.post('/core-graphs', this.getCallParams('core_12'), config)
      .then(response => {
        if (response.data.message) {
          this.setState({ mCoreViolationBySeletedLoading: false });
        } else {
          this.setState({ mCoreViolationBySeletedData: response.data.day_ranges, mCoreViolationBySeletedLoading: false, granularity: this.state.searchQuery.granularity });
        }
      })
      .catch(error => {
        errors(this, error);
      })
    }
    //Here API is being called to get Compliance breakdown of imeis count and age which do not meet any condition .

    // const orderArrComplianceBreakDown = [
    //   "compliant_imeis",
    //   "compliant_imeis %",
    //   "compliant_triplets",
    //   "compliant_triplets %",
    //   "non-compliant_imeis",
    //   "non-compliant_imeis %",
    //   "non-compliant_triplets",
    //   "non-compliant_triplets %",
    //  ];

    instance.post('/core-graphs', this.getCallParams('core_13'), config)
      .then(response => {
        if (response.data.message) {
          this.setState({ mCoreComplianceBreakdownLoading: false });
        } else {
          // const formatedData = verticleDataTableFormat([response.data.Compliance_Breakdown]);
          // const reorderedData = reorderData(formatedData, orderArrComplianceBreakDown);
          this.setState({ mCoreComplianceBreakdownData: response.data.Compliance_Breakdown, mCoreComplianceBreakdownHeaderData: ["Compliant and Non-Compliant as of selected date", "IMEIs", "IMEI %", "Triplets", "Triplet %"], mCoreComplianceBreakdownLoading: false });
        }
      })
      .catch(error => {
        errors(this, error);
      })

    //Here API is being called to get Compliance breakdown of imeis count and age which do not meet any condition .

    instance.post('/core-graphs', this.getCallParams('core_14'), config)
      .then(response => {
        if (response.data.message) {
          this.setState({ mCoreIdentifierTrendLoading: false });
        } else {
          this.setState({ mCoreIdentifierTrendsData: response.data.monthly_results, mCoreIdentifierTrendLoading: false });
        }
      })
      .catch(error => {
        errors(this, error);
      })

    // Here is API is being called to get data for Condition Combination Breakdown 

    const orderArrConditionalBreakdown = [
      "GSMA_NOT_FOUND",
      "MALFORMED",
      "NOT_ON_REGISTRATION_LIST",
      "ON_LOCAL_STOLEN_LIST",
      "DUPLICATE_COMPOUND",
      "BLOCKING",
      "UNIQUE_IMEIS",
      "IMEI_IMSI_PAIRS",
      "TRIPLETS",
     ];

    const mockHeaderConditionalBreakdown = [
      "GSMA Not Found",
      "Malformed",
      "Not On Registration List",
      "On Local Stolen List",
      "Duplicate Compound",
      "Blocking",
      "Unique IMEIs",
      "IMEI IMSI Pair",
      "Triplets",
     ];

    instance.post('/core-graphs', this.getCallParams('core_16'), config)
      .then(response => {
        if (response.data.message) {
          this.setState({ mCoreClassificationLoading: false });
        } else {
          let formatedDataConditional = ConditionalBreakdownFormat(response.data);
          const formatedData = FormatDataForDataTable(formatedDataConditional, false, orderArrConditionalBreakdown);
          this.setState({ mCoreClassificationData: formatedData.content, mCoreClassificationHeaderData: mockHeaderConditionalBreakdown, mCoreClassificationLoading: false });
        }
      })
      .catch(error => {
        errors(this, error);
      })

        //Here API is being called to get data based on Condition Combinations Breakdown. In response we are setting the state with the recieved data

        let core15Params =  this.getCallParams('core_15');
        core15Params.start_date = moment(core15Params.trend_year + '-' + core15Params.trend_month + '-01').subtract(6,'month').format(Date_Format);
        core15Params.end_date = moment(core15Params.trend_year + '-' + core15Params.trend_month + '-01').format(Date_Format);
        delete core15Params.trend_month ;
        delete core15Params.trend_year ;
        instance.post('/core-graphs', core15Params, config)
        .then(response => {
            if(response.data.message) {
              this.setState({ mCoreConditionsBreakdownLoading: false });
            } else {
              this.setState({ mCoreConditionsBreakdownData: response.data.conditional_breakdown, mCoreConditionsBreakdownLoading: false, granularity: this.state.searchQuery.granularity});
            }
        })
        .catch(error => {
            errors(this, error);
        })
  }

  render() {
    const { apiFetched, mCoreIdentifierCountData, mCoreIdentifierTrendUniqueData, mCoreLostStolenIMEIData, mCoreBlacklistedData, mCoreBlacklistViolationData, mCoreViolationBySeletedData, mCoreComplianceBreakdownData, mCoreIdentifierTrendsData, mCoreClassificationData, mCoreConditionsBreakdownData, mCoreIdentifierCountHeaderData, mCoreBlacklistedHeaderData, mCoreComplianceBreakdownHeaderData, mCoreClassificationHeaderData, mCoreIdentifierCountLoading, mCoreIdentifierTrendUniqueLoading, mCoreLostStolenIMEILoading, mCoreBlacklistedLoading, mCoreBlacklistViolationLoading, mCoreViolationBySeletedLoading, mCoreComplianceBreakdownLoading, mCoreIdentifierTrendLoading, mCoreClassificationLoading, mCoreConditionsBreakdownLoading, granularity, totalImies, invalidImies, validImies, blacklistImies, exceptionImies, notifImies, deletedObj } = this.state;
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
                <div id="searchFormDiv" style={{ "display": "block" }}>
                  <SearchForm callServer={this.saveSearchQuery} showHideComponents={this.filtersSidebarDisplay} />
                </div>
                <div style={{ "display": "block" }}>
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
                <div id="searchFormDiv" style={{ "display": "block" }}>
                  <SearchForm callServer={this.saveSearchQuery} showHideComponents={this.filtersSidebarDisplay} isMNORequired={true} isRange={false} />
                </div>
                <div style={{ "display": "none" }}>
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

                {/* Here we are rendering reusable charts and passing them props according to the need.
               (Title, loading, data, xAxis and yAxes are the only mandatory props for bar and line charts ||
                Title, loading, headers and rows are mandatory props for tables )   */}
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
                   <div name='mCoreIdentifierCountKey' key="mCoreIdentifierCountKey" className={deletedObj.mCoreIdentifierCountKey === true && 'hidden'}>
                   <DataTable cardClass="card-primary" title="Identifier Counts" loading={mCoreIdentifierCountLoading} headings={mCoreIdentifierCountHeaderData} rows={mCoreIdentifierCountData} granularity={granularity} info={IdentifierCount} heightProp={this.getElementHeight(document.getElementsByName('mCoreIdentifierCountKey')[0])} removeChart={this.onRemoveItem} chartGridId={'mCoreIdentifierCountKey'} />
                    </div>
                    <div name='mCoreIdentifierTrendUniqueKey' key="mCoreIdentifierTrendUniqueKey" className={deletedObj.mCoreIdentifierTrendUniqueKey === true && 'hidden'}>
                    <Linechart cardClass="card-primary" title="Identifier Trends of Unique IMEIs, IMSIs and MSISDNs" loading={mCoreIdentifierTrendUniqueLoading} data={mCoreIdentifierTrendUniqueData} xAxis={"x_axis"} yAxisLabel="Identifier Trends Count" yAxes={["unique_imeis", "unique_imsis", "unique_msisdns"]} legendIconType="circle" colorArray={this.getColorArray(32)} granularity={granularity} info={IdentifierTrendsOfUnique} heightProp={this.getElementHeight(document.getElementsByName('mCoreIdentifierTrendUniqueKey')[0])} removeChart={this.onRemoveItem} chartGridId={'mCoreIdentifierTrendUniqueKey'}/>
                    </div>
                    <div name='mCoreComplianceBreakdownKey' key="mCoreComplianceBreakdownKey" className={deletedObj.mCoreComplianceBreakdownKey === true && 'hidden'}>
                    <ComplianceBreakdownTable cardClass="card-warning" title="Compliance Breakdown" loading={mCoreComplianceBreakdownLoading} headings={mCoreComplianceBreakdownHeaderData} rows={mCoreComplianceBreakdownData} info={complianceBreakdown} heightProp={this.getElementHeight(document.getElementsByName('mCoreComplianceBreakdownKey')[0])} removeChart={this.onRemoveItem} chartGridId={'mCoreComplianceBreakdownKey'}/>
                    </div>    
                    <div name='mCoreIdentifierTrendsKey' key="mCoreIdentifierTrendsKey" className={deletedObj.mCoreIdentifierTrendsKey === true && 'hidden'}>
                    <Linechart cardClass="card-primary" title="Identifier Trends" loading={mCoreIdentifierTrendLoading} data={mCoreIdentifierTrendsData} xAxis={"x_axis"} yAxisLabel="Percentage of Trends" yAxes={["compliant_imeis %", "non-compliant_imeis %"]} legendIconType="circle" colorArray={this.getColorArray(32)} info={IdentifierTrends}  heightProp={this.getElementHeight(document.getElementsByName('mCoreIdentifierTrendsKey')[0])} removeChart={this.onRemoveItem} chartGridId={'mCoreIdentifierTrendsKey'}/>
                    </div> 
                    <div name='mCoreBlacklistViolationKey' key="mCoreBlacklistViolationKey" className={deletedObj.mCoreBlacklistViolationKey === true && 'hidden'}>
                    <HorizontalBarSegregateChart cardClass="card-success" title="Blacklist Violations by Days Past Block Date" yAxisLabel="Days Past Block Date" loading={mCoreBlacklistViolationLoading} data={mCoreBlacklistViolationData} colorArray={this.getColorArray(20)} granularity={granularity} info={nationalBlacklist} heightProp={this.getElementHeight(document.getElementsByName('mCoreBlacklistViolationKey')[0])} removeChart={this.onRemoveItem} chartGridId={'mCoreBlacklistViolationKey'}/>
                    </div>
                    <div name='mCoreLostStolenIMEIKey' key="mCoreLostStolenIMEIKey" className={deletedObj.mCoreLostStolenIMEIKey === true && 'hidden'}>
                    <Piechart  cardClass="card-danger" title="Lost/Stolen IMEI's Seen On Network" loading={mCoreLostStolenIMEILoading} data={mCoreLostStolenIMEIData} value="value" colorArray={blueShadsColors} granularity={granularity}  innerRadiusProp={70} paddingProp={2} info={lostStolenIMEIOnNetwork} heightProp={this.getElementHeight(document.getElementsByName('mCoreLostStolenIMEIKey')[0])} removeChart={this.onRemoveItem} chartGridId={'mCoreLostStolenIMEIKey'}/>
                    </div>
                    <div name='mCoreBlacklistedKey' key="mCoreBlacklistedKey" className={deletedObj.mCoreBlacklistedKey === true && 'hidden'}>
                    <DataTable cardClass="card-warning" title="Blacklist IMEIs per Operator and Reason" loading={mCoreBlacklistedLoading} headings={mCoreBlacklistedHeaderData} rows={mCoreBlacklistedData} granularity={granularity} info={operatorWiseReason} heightProp={this.getElementHeight(document.getElementsByName('mCoreBlacklistedKey')[0])} removeChart={this.onRemoveItem} chartGridId={'mCoreBlacklistedKey'}/>
                    </div>
                    <div name='mCoreViolationBySeletedKey' key="mCoreViolationBySeletedKey" className={ (this.state.searchQuery.mno === "all" || deletedObj.mCoreViolationBySeletedKey === true) && 'hidden'}>
                    <HorizontalBarSegregateChart cardClass="card-danger" title="Violations By Selected Operator" loading={mCoreViolationBySeletedLoading} data={mCoreViolationBySeletedData} colorArray={this.getColorArray(36)} granularity={granularity} info={nationalBlacklistByMNO} heightProp={this.getElementHeight(document.getElementsByName('mCoreViolationBySeletedKey')[0])} removeChart={this.onRemoveItem} chartGridId={'mCoreViolationBySeletedKey'}/>
                    </div>
                    <div name='mCoreConditionsBreakdownKey' key="mCoreConditionsBreakdownKey" className={deletedObj.mCoreConditionsBreakdownKey === true && 'hidden'}>
                    <Piechart cardClass="card-success" title="Conditions Breakdown" loading={mCoreConditionsBreakdownLoading} data={mCoreConditionsBreakdownData} value="value" colorArray={BoxesColors} granularity={granularity} innerRadiusProp={70} paddingProp={2} info={conditionalBreakDownIMEI}  heightProp={this.getElementHeight(document.getElementsByName('mCoreConditionsBreakdownKey')[0])} removeChart={this.onRemoveItem} chartGridId={'mCoreConditionsBreakdownKey'}/>
                    </div>
                    <div name='mCoreClassificationKey' key="mCoreClassificationKey" className={deletedObj.mCoreClassificationKey === true && 'hidden'}>
                    <DataTable cardClass="card-primary" title="Classification Conditions Breakdown" loading={mCoreClassificationLoading} headings={mCoreClassificationHeaderData} rows={mCoreClassificationData} info={conditionalBreakdown} heightProp={this.getElementHeight(document.getElementsByName('mCoreClassificationKey')[0])} removeChart={this.onRemoveItem} chartGridId={'mCoreClassificationKey'} />
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

MonthYearTrends.defaultProps = {
  className: "layout",
  cols: { lg: 100, md: 100, sm: 6, xs: 4, xxs: 2 },
  breakpoints: {lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0},
  initialLayout: [
    {i: 'mCoreIdentifierCountKey', x: 0, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'mCoreIdentifierTrendUniqueKey', x: 50, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'mCoreComplianceBreakdownKey', x: 0, y: 0, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6)},
    {i: 'mCoreIdentifierTrendsKey', x: 50, y: 0, w: 50, h: (50/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'mCoreBlacklistViolationKey', x: 0, y: 0, w: 50, h: (50/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'mCoreLostStolenIMEIKey', x: 50, y: 0, w: 50, h: (50/100*56.6)  , isResizable: false },
    {i: 'mCoreBlacklistedKey', x: 0, y: 4, w: 100, h: (50/100*56.6)   , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'mCoreViolationBySeletedKey', x: 50, y: 2, w: 50, h: (50/100*56.6)  , minW: 33, minH: 20, maxW: 100, maxH: (75/100*56.6) },
    {i: 'mCoreConditionsBreakdownKey', x: 0, y: 2, w: 50, h: (50/100*56.6) , isResizable: false },
    {i: 'mCoreClassificationKey', x: 0, y: 10, w: 100, h: (50/100*56.6) , minW: 33, minH: 20, maxW: 100, maxH: 100  }
  ]
};

export default MonthYearTrends;