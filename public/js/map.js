// wrap other $() operations on your page that depend on the DOM being ready
$(function() {
  var map;

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

    // display public transit network using the TransitLayer object
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap(map);

  } // closing tag for initialize function

function addMarker(lat, long, description) {
    var thisLatLong = new google.maps.LatLng(lat,long);
    console.log(map);

    var marker = new google.maps.Marker({
      position: thisLatLong,
      map: map,
      description: description
    });

    addInfoWindow(marker, description);
  }

  function addInfoWindow(marker, description) {
    var infowindow = new google.maps.InfoWindow({
      content: description
    });

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(marker.get('map'), marker);
    });
  }

  function loadPlaces() {
    $.getJSON('/places').done(function(data) {
      data.places.forEach(function(place) {
        console.log(place);
        addMarker(place.lat, place.long, place.address);
      });
    }).fail(function() {
      alert('Could not load stored places');
    });
  }

  initialize();
  loadPlaces();


}); // closing tag for everything in this file



