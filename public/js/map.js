// wrap other $() operations on your page that depend on the DOM being ready
$(function() {
  var map;
  var transitLayer;
  var bikeLayer;
  var trafficLayer;

  function initialize() {
    // get the div element to put the map in
    var mapDiv = document.getElementById('map-canvas');

    // MapOptions fields which affect the visibility and presentation of controls
    var mapOptions = {
      zoom: 12,
      center: new google.maps.LatLng(37.768120, -122.441875),
      mapTypeId: google.maps.MapTypeId.TERRAIN
    };

    // Map constructor creates a new map using any optional parameters that are passed in
    map = new google.maps.Map(mapDiv, mapOptions);

    transitLayer = new google.maps.TransitLayer();
    bikeLayer = new google.maps.BicyclingLayer();
    trafficLayer = new google.maps.TrafficLayer();

  } // closing tag for initialize function

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
          title: place.address
        });

        var infowindow = new google.maps.InfoWindow({
          content: place.description
        });

        google.maps.event.addListener(marker, 'click', function() {
          infowindow.open(marker.get('map'), marker);
        });
      }); // closing bracket for forEach
    }).fail(function() {
      console.log('User not signed in');
    });
  }

  initialize();
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