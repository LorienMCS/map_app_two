$(function() {
  var geocoder;
  var map;
  var data;

  function initialize() {
    // get the div element to put the map in
    var mapDiv = document.getElementById('map-canvas');

    geocoder = new google.maps.Geocoder();

    // MapOptions fields which affect the visibility and presentation of controls
    var mapOptions = {
      zoom: 13,
      center: new google.maps.LatLng(37.768120, -122.441875),
      mapTypeId: google.maps.MapTypeId.TERRAIN
    };

    // Map constructor creates a new map using any optional parameters that are passed in
    map = new google.maps.Map(mapDiv, mapOptions);

    // display public transit network using the TransitLayer object
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap(map);


    //   google.maps.event.addListener(map, 'click', addMarker);
  }

  initialize();

  /* Detect iPhone and Android devices by inspecting the navigator.userAgent
  property within the DOM, to alter layout for particular devices. */
  function detectBrowser() {
    var useragent = navigator.userAgent;
    var mapdiv = document.getElementById("map-canvas");

    if (useragent.indexOf('iPhone') != -1 || useragent.indexOf('Android') != -1) {
      mapdiv.style.width = '100%';
      mapdiv.style.height = '100%';
    } else {
      mapdiv.style.width = '600px';
      mapdiv.style.height = '800px';
    }
  }

});



//   // Since I'm not adding markers yet, I could use this code
//   function loadPlaces() {
//     // instead of .get, use .getJSON (or you will get back HTML)
//     // a function that jQuery provides, that sets Accept header tag
//     // to Accept: JSON
//     $.getJSON("/places").done(function(data) {
//       var myObj = data.places;
//       console.log(myObj);
//       $.each(myObj, function(item) {
//         var location = myObj[item].address;
//         //console.log(location);
//         var lat = myObj[item].lat;
//         var long = myObj[item].long;
//         //console.log(url);
//         // Tim said "basically this is string addition"
//         $("#details").append('<div>' + location + '</div>');
//         $("#details").append('<div>' + lat + '</div>');
//         $("#details").append('<div>' + long + '</div>');
//       });
//     });
//   }

//   loadPlaces();


//   //  The code below is modifying layout.ejs (since that's the ejs file
//   //  we have linked, via partials/headerlayout, to this static js file)
//   //  code that runs on click of the link with the id newplacelink
//   $('#newplacelink').click(function(e) {
//     e.preventDefault();
//     var newform = '<div><form id="newplaceform" action="/places" method="POST">' +
//       '<div class="form-group">' +
//       '<label for="address">Address: </label><input type="text" class="form-control" name="place[address]" id="address" autofocus>' +
//       '</div>' +
//       '<div class="form-group">' +
//       '<label for="latitude">Latitude: </label>' +
//       '<input type="text" class="form-control" name="place[lat]" id="latitude">' +
//       '</div>' +
//       '<div class="form-group">' +
//       '<label for="longitude">Longitude: </label>' +
//       '<input type="text" class="form-control" name="place[long]" id="longitude">' +
//       '</div>' +
//       '<input type="submit" value="Add" class="btn btn-lg btn-success">' +
//       '</form></div>';
//     // just like .append, except last child of element
//     // put it after logout element
//     $('#logout').after(newform);

//     // unless you put this submit event inside the click event,
//     // the newplaceform isn't in the DOM the very first time
//     // until you click the add button, so this code won't work
//     $('#newplaceform').submit(function(e) {
//       e.preventDefault();

//       // this is data that's coming from the form user input
//       var address = $('#address').val();
//       var lat = $('#latitude').val();
//       var long = $('#longitude').val();

//       // the key names are from the place Schema
//       data = {
//         place: {
//           address: address,
//           lat: lat,
//           long: long
//         }
//       };


//       // I didn't read the instructions carefully enough, and ended up making
//       // my request to geolocation api from client-side
//       // GeocodeRequest object literal containing the input terms
//       geocoder.geocode({
//         'address': address,
//       }, function(results, status) {
//         if (status == google.maps.GeocoderStatus.OK) {
//           if (results[0]) {
//             if (!data.place.lat || !data.place.long) {
//               data.place.lat = results[0].geometry.location.A;
//               data.place.long = results[0].geometry.location.F;
//             }
//             map.setCenter(results[0].geometry.location);
//             var marker = new google.maps.Marker({
//               map: map,
//               position: results[0].geometry.location
//             });
//             postToDB();
//           } else {
//             alert('No results found');
//           }
//         } else {
//           alert("Geocode was not successful for the following reason: " + status);
//         }
//       });

//       var postToDB = function() {
//       // we created the data to post, above
//       $.ajax({
//         // A set of key/value pairs that configure the Ajax request
//         // The HTTP method to use for the request (e.g. "POST", "GET", "PUT"). (version added: 1.9.0)
//         // type is an alias for method. You should use type if you're using versions of jQuery prior to 1.9.0.
//         method: 'POST',
//         // A string containing the URL to which the request is sent.
//         url: '/places',
//         // Data to be sent to the server. It is converted to a query string, if not already a string.
//         // It's appended to the url for GET-requests.
//         data: data,
//         // The type of data that you're expecting back from the server.
//         dataType: 'json'
//       }).done(function(data) {
//         // the data object below contains one place
//         console.log(data);
//         // to clear the previously typed data out of the form
//         $(".form-control").val("");

//         // address, lat and long are variables that are set equal to the
//         // data that was captured through the form
//         // could instead have used data.address, etc
//         // to access the address, etc in the json object
//         // this is just for testing, until I figure out how to automatically add markers
//         // $("#details").append('<div>' + address + '</div>');
//         // $("#details").append('<div>' + lat + '</div>');
//         // $("#details").append('<div>' + long + '</div>');
//         // could hide it instead of removing it
//         // but then you would have to change other code to show it
//         $("#newplaceform").remove();
//       });
//     };



//     });
//   });

// });