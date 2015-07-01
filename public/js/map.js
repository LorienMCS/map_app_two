// wrap other $() operations on your page that depend on the DOM being ready
$(function() {
  var directionsDisplay;
  var directionsService = new google.maps.DirectionsService();
  var map;
  var userLatLong;
  var transitLayer;
  var bikeLayer;
  var trafficLayer;
  var weather;
  var mapLat = 37.768120;
  var mapLong = -122.441875;

  function initialize() {
    // get the div element to put the map in
    var mapDiv = document.getElementById('map-canvas');

    directionsDisplay = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      suppressInfoWindows: true
    });

    // MapOptions fields which affect the visibility and presentation of controls
    var mapOptions = {
      zoom: 12,
      center: new google.maps.LatLng(mapLat, mapLong),
      mapTypeId: google.maps.MapTypeId.TERRAIN
    };

    // Map constructor creates a new map using any optional parameters that are passed in
    map = new google.maps.Map(mapDiv, mapOptions);
    directionsDisplay.setMap(map);

    transitLayer = new google.maps.TransitLayer();
    bikeLayer = new google.maps.BicyclingLayer();
    trafficLayer = new google.maps.TrafficLayer();

  } // closing tag for initialize function

  function checkForLoc() {
    if (Modernizr.geolocation) {
      navigator.geolocation.getCurrentPosition(getLoc, resErr);
    } else {
      alert('Your browser does not support geolocation');
      weather = 'https://api.wunderground.com/api/0fd9bd78fc2f4356/geolookup/conditions/q/' + mapLat + ',' + mapLong + '.json';
    }
  }

  function getLoc(location) {
    var userLat = location.coords.latitude;
    var userLong = location.coords.longitude;
    userLatLong = new google.maps.LatLng(userLat, userLong);
    var marker = new google.maps.Marker({
      position: userLatLong,
      map: map,
      title: "You Are Here!",
      icon: 'usermarker.png'
    });
    weather = 'https://api.wunderground.com/api/0fd9bd78fc2f4356/geolookup/conditions/q/' + userLat + ',' + userLong + '.json';
    getWeather(weather);
  }

  function resErr(error) {
    if (error.code == 1) {
      alert('Your privacy is respected! Your location has not been detected.');
    } else if (error.code == 2) {
      alert('Location Unavailable');
    } else if (error.code == 3) {
      alert('TimeOut');
    }
    weather = 'https://api.wunderground.com/api/0fd9bd78fc2f4356/geolookup/conditions/q/' + mapLat + ',' + mapLong + '.json';
    getWeather(weather);
  }


  function getWeather(weather) {
    $.ajax({
      url: weather,
      jsonp: "callback",
      dataType: "jsonp"
    }).done(function(data) {
      //setting the spans to the correct parameters
      $('#location').html(data['location']['city']);
      $('#temp').html(data['current_observation']['temp_f']);
      $('#desc').html(data['current_observation']['weather']);
      $('#wind').html(data['current_observation']['wind_string']);
      //filling the image src attribute with the image url
      $('#img').attr('src', data['current_observation']['icon_url']);
    });
  }

  function calcRoute(orig, dest) {
    var selectedMode = document.getElementById('mode').value;
    var request = {
      origin: orig,
      destination: dest,
      // Note that Javascript allows us to access the constant
      // using square brackets and a string value as its
      // "property."
      travelMode: google.maps.TravelMode[selectedMode]
    };
    directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(response);
      }
    });
  }

  function loadPlaces() {
    $.getJSON('/places').done(function(data) {
      data.places.forEach(function(place) {
        var thisLatLong = new google.maps.LatLng(place.lat, place.long);

        // From the Google docs: The following fields are particularly
        // important and commonly set when constructing a marker:
        // position (required) specifies a LatLng identifying the initial location of the marker.
        // map (optional) specifies the Map on which to place the marker.
        // The marker's title will appear as a tooltip.
        var marker = new google.maps.Marker({
          position: thisLatLong,
          map: map,
          title: place.address,
          icon: 'sfmarker.png'
        });

        var infowindow = new google.maps.InfoWindow({
          content: place.description
        });

        google.maps.event.addListener(marker, 'click', function() {
          infowindow.open(marker.get('map'), marker);
          calcRoute(userLatLong, thisLatLong);
        });
      }); // closing bracket for forEach
    }).fail(function() {
      console.log('User not signed in');
    });
  }

  initialize();
  checkForLoc();
  loadPlaces();

  //display public transit network using the TransitLayer object
  function showTransit() {
    bikeLayer.setMap(null);
    trafficLayer.setMap(null);
    if (typeof transitLayer.getMap() == 'undefined' || transitLayer.getMap() === null) {
      transitLayer.setMap(map);
    } else {
      transitLayer.setMap(null);
    };
  }

  function showBike() {
    transitLayer.setMap(null);
    trafficLayer.setMap(null);
    if (typeof bikeLayer.getMap() == 'undefined' || bikeLayer.getMap() === null) {
      bikeLayer.setMap(map);
    } else {
      bikeLayer.setMap(null);
    };
  }

  function showTraffic() {
    bikeLayer.setMap(null);
    transitLayer.setMap(null);
    if (typeof trafficLayer.getMap() == 'undefined' || trafficLayer.getMap() === null) {
      trafficLayer.setMap(map);
    } else {
      trafficLayer.setMap(null);
    };
  }

  $("#transit").click(function(event) {
    event.stopPropagation();
    showTransit();
  });

  $("#bike").click(function(event) {
    event.stopPropagation();
    showBike();
  });

  $("#traffic").click(function(event) {
    event.stopPropagation();
    showTraffic();
  });

}); // closing tag for everything in this file