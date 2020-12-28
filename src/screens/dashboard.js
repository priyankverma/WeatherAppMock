import React, {Component} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Image,
  Platform,
  FlatList,
  Dimensions,
  Alert,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const {height: WINDOW_HEIGHT, width: WINDOW_WIDTH} = Dimensions.get('window');
import TextTicker from 'react-native-text-ticker';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Geolocation from '@react-native-community/geolocation';
import {
  request,
  PERMISSIONS,
  RESULTS,
  check,
  openSettings,
} from 'react-native-permissions';
import {fetchRecords} from '../redux/actions/weatherReportAction';
let unsubscribe;
const weekDays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      temperatureArray:
        this.props.weatherReport &&
        this.props.weatherReport.weatherData &&
        this.props.weatherReport.weatherData.list,
      userLat: undefined,
      userLong: undefined,
      showMarquee: false,
      netConnected: true,
    };
  }

  static getDerivedStateFromProps(nextProps, state) {
    // Store prevData(temperatureArray) in state so we can compare when props change.
    // Clear out previously-loaded data (so we don't render stale stuff).
    if (
      nextProps.weatherReport.weatherData &&
      nextProps.weatherReport.weatherData.list !==
        (state && state.temperatureArray)
    ) {
      Dashboard.timeSlot(nextProps.weatherReport.weatherData.list, state);
      return {temperatureArray: nextProps.weatherReport.weatherData.list};
    }

    // No state update necessary
    return null;
  }
  componentDidMount = () => {
    unsubscribe = NetInfo.addEventListener((state) => {
      this.setState({netConnected: state.isConnected});
    });
    const makeStaticFunc = Dashboard.timeSlot(); // create a static function by passing the reference to the same
    this.setState({makeStaticFunc});

    this.checkLocationPermission(); // check the status of the permission
  };

  checkLocationPermission = () => {
    check(
      Platform.select({
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      }),
    )
      .then((result) => {
        switch (result) {
          case RESULTS.UNAVAILABLE:
            console.log(
              'This feature is not available (on this device / in this context)',
            );
            break;
          case RESULTS.DENIED:
            console.log(
              'The permission has not been requested / is denied but requestable',
            );
            this.requestLocationPermission();
            break;
          case RESULTS.GRANTED:
            console.log('The permission is granted');

            this.fetchCoordinates();

            break;
          case RESULTS.BLOCKED:
            console.log('The permission is denied and not requestable anymore');
            Alert.alert(
              'Error',
              'You have restricted the use of GPS for the application, please go to Settings and provide the location permission.',
              [
                {
                  text: 'Cancel',
                  onPress: () => {
                    this.setState({showMarquee: true});
                    this.props.fetchRecords(); // coordinates of Delhi used by default, see the function Definition in weatherReportAction.js
                  },
                  style: 'cancel',
                },
                {
                  text: 'Open Settings',
                  onPress: () =>
                    openSettings().catch(
                      () => console.warn('cannot open settings'), // opens the settings on device
                    ),
                },
              ],
              {cancelable: false},
            );

            break;
        }
      })
      .catch((error) => {
        console.log('error', error);
      });
  };

  requestLocationPermission = () => {
    //  request Permission
    request(
      Platform.select({
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      }),
    ).then((result) => {
      this.fetchCoordinates();
    });
  };

  fetchCoordinates = () => {
    // get user coordinates

    Geolocation.getCurrentPosition(
      (position) => {
        let userLat = position.coords ? position.coords.latitude : '';
        let userLong = position.coords ? position.coords.longitude : '';
        const initialPosition = JSON.stringify(position);
        this.props.fetchRecords(userLat, userLong);
        this.setState({
          long: position.coords ? position.coords.longitude : '',
          latt: position.coords ? position.coords.latitude : '',
          showLoader: false,
        });
      },
      (error) => console.log(error),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
    );
  };

  static timeSlot = (stamps, state) => {
    // filter out the required slots
    let currentSlot = [];

    stamps &&
      stamps.filter((item, index) => {
        item.dt_txt = item.dt_txt.split('-').join('/');
        currentSlot = this.checkSlot(item.dt_txt)
          ? [...currentSlot, item]
          : [...currentSlot];
      });
    if (stamps) return (state.currentSlot = currentSlot);
  };
  static checkSlot = (timeThen) => {
    // check for the latest update and make it default for all days
    timeThen = new Date(timeThen);
    let interTime = new Date().setDate(timeThen.getDate());
    let timeNow = new Date(interTime).setFullYear(timeThen.getFullYear()); // to overcome year change issue

    let timeDiff = (timeThen - timeNow) / 1000;
    let minutes = ((timeDiff / 3600) % 24) * 60;

    if (minutes >= -180 && minutes < 0) {
      return true;
    }
  };
  renderItem = ({item, index}) => {
    // listing on temp for various days
    return (
      <View
        style={[
          styles.dayList,
          {
            borderTopWidth: index == 0 ? 2 : 1,
            borderBottomWidth: index == 4 ? 2 : 1,
          },
        ]}>
        <Text style={styles.dayText}>
          {/* {new Date(item.dt * 1000).toLocaleDateString('en-US', {
            weekday: 'long',
          })}  THIS IS WORKING ONLY IN DEBUGGER, THEREFORE REMOVING THIS*/}
          {weekDays[new Date(item.dt_txt).getDay()]}
        </Text>
        <View style={styles.tempView}>
          <Text style={styles.tempText}>{item.main.temp}</Text>
          <Image
            style={[styles.weatherIconMain, {height: 40, width: 40}]}
            source={{
              uri:
                'http://openweathermap.org/img/wn/' +
                item.weather[0].icon +
                '@2x.png',
            }}
          />
        </View>
      </View>
    );
  };
  componentWillUnmount = () => {
    unsubscribe();
  };

  render() {
    const {weatherReport} = this.props;
    const {
      currentSlot,
      showMarquee,
      refreshing,
      userLat,
      userLong,
      netConnected,
    } = this.state;
    console.log('currentSlt', currentSlot);
    const {weatherData} = weatherReport;
    if (weatherReport && weatherReport.loading) {
      return (
        <View style={styles.container}>
          <Image source={require('../assets/images/loader.gif')} />
          <Text style={{fontSize: 16}}>Loading, please wait</Text>
        </View>
      );
    } else if ((weatherData && weatherData.error) || !netConnected) {
      return (
        <View style={styles.container}>
          <Image
            style={styles.errorImage}
            source={require('../assets/images/error.png')}
          />
          <TouchableOpacity
            onPress={() => this.checkLocationPermission()}
            style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <SafeAreaView style={{flex: 1}}>
          {refreshing ? <ActivityIndicator /> : null}

          {showMarquee ? (
            <TouchableOpacity
              onPress={() => openSettings().catch((err) => console.log('err'))}
              style={{backgroundColor: 'red'}}>
              <TextTicker
                style={styles.marqueeText}
                loop
                bounce
                marqueeOnMount
                scrollSpeed={250}
                repeatSpacer={50}
                marqueeDelay={1000}>
                Using the default coordinates, for accurate Results, tap this
                banner and provide Location permissions.
              </TextTicker>
            </TouchableOpacity>
          ) : null}
          <View style={styles.locationWrapper}>
            {currentSlot &&
              currentSlot.length &&
              currentSlot[0].weather &&
              currentSlot[0].weather.length && (
                <Image
                  style={styles.weatherIconMain}
                  source={{
                    uri:
                      'http://openweathermap.org/img/wn/' +
                      currentSlot[0].weather[0].icon +
                      '@2x.png',
                  }}
                />
              )}
            {currentSlot &&
              currentSlot.length &&
              currentSlot[0].main &&
              currentSlot[0].main.temp && (
                <Text style={{fontSize: 52}}>{currentSlot[0].main.temp}</Text>
              )}
            <Text style={{fontSize: 22}}>
              {currentSlot &&
                currentSlot.length &&
                weatherData &&
                weatherData.city &&
                weatherData.city.name}
            </Text>
          </View>
          <View style={{flex: 0.4}}>
            <FlatList
              contentContainerStyle={{alignContent: 'flex-end'}}
              data={currentSlot}
              renderItem={this.renderItem}
              keyExtractor={(item) => item.dt}
              refreshControl={
                <RefreshControl
                  //refresh control used for the Pull to Refresh
                  refreshing={refreshing}
                  onRefresh={() => this.props.fetchRecords(userLat, userLong)}
                />
              }
            />
            <Text style={{fontSize: 10, alignSelf: 'center'}}>
              <Text style={{fontWeight: 'bold'}}>Note:</Text> All the values
              shown are to be read in degree Celsius.
            </Text>
          </View>
        </SafeAreaView>
      );
    }
  }
}
const mapStateToProps = (state) => {
  return {
    weatherReport: state.weatherReport,
  };
};
const mapDispatchToProps = (dispatch) =>
  bindActionCreators({fetchRecords}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marqueeText: {fontSize: 14, paddingVertical: 8},
  locationWrapper: {
    flex: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherIconMain: {
    height: 120,
    width: 120,
    resizeMode: 'contain',
    alignSelf: 'flex-end',
  },
  errorImage: {
    resizeMode: 'contain',
    width: WINDOW_WIDTH,
  },
  dayList: {
    backgroundColor: 'white',

    borderColor: 'black',
    height: WINDOW_HEIGHT * 0.06,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayText: {paddingHorizontal: 30, fontWeight: '600', fontSize: 22},
  tempView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempText: {
    fontSize: 18,
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: '#347eff',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    alignSelf: 'center',
    position: 'absolute',
    bottom: '15%',
  },
  retryText: {
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
