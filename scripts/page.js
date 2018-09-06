var buttons = [];           // array of buttons
var favorites = [];         // array of objects identifying favorite images

var myAPIKey = "3AFkSx6nd8NPugiU5xJtbRdNWYAeS83c";

// Audio
var buzz = new Audio ("audio/buzz.mp3");
var ting = new Audio ("audio/ting.mp3");

function playAudio (sound)
{   // This code might get called repeatedly from several places in the script.  So it goes in a function
    // to ensure that it gets handled the same way each time

    // audio may not play properly if it is not explicitly loaded before each .play()
    sound.load ();
    sound.play ();
}

function flashIt (elem, num)
{   // This is an error condition -- the user has tried to create a new button that already exists.
    //
    // It's possible that the list of buttons can get quite long and spotting an existing button
    // with the selected text might be difficult.  So quickly alternate the background of the selected
    // button element to make it stand out.

    if (num === undefined) num = 9;
    if (num === 0) return;

    if ((num % 2) != 0)
    {   $(elem)
            .css("background-color", "blue")
            .css("color", "white");
    }
    else
    {   $(elem)
        .css("background-color", "white")
        .css("color", "darkblue");
    }

    setTimeout (function()
    {   // If I try to decriment num in the function call to flashIt() (ie: flashIt (function(), num--))
        // an undefined value is passed.  Since I test for an undefined value above (I'm doing that to
        // improve the readability of the code -- after all why does any other function in the script need
        // to know how many times to flash the button) num always get set to 10.  Hello infinite loop!  So
        // I have to decriment num here...
        num--;

        flashIt (elem, num);        
    }, 100);
}

function getButtons ()
{   // getButtons() is only called when the page is loaded.  It's only function is to initialize buttons[]
    // from window.localStorage

    if (localStorage.getItem("buttons"))
        buttons = window.localStorage.getItem("buttons").split(",");
}

function getFavorites ()
{   // getFavorites() is only called when the page is loaded.  It's only function is to initialize favorites[]
    // from window.localStorage

//     if (localStorage.getItem("favorites"))
//         favorites = window.localStorage.getItem("favorites").split(",");
    favorites = [];
}

function displayButtons ()
{   // make a button for each element in buttons[]

    // first clear #button-div to prevent any possibility of creating duplicate buttons
    $(".button-div").empty();

    var bLength = buttons.length;

    if (bLength === 0)
    {   // if bLength is 0, display a message in .button-div and return

        var newP = $("<p>");
        newP.text ("You don't have any buttons yet");
        $(".button-div").append(newP);

        return;
    }

    // If the script got to this point, there are elements in button[] representing the user-defined
    // buttons for the application.  Display them.
    //
    // And remember, I want all comparisons and jQuery selectors to be case insensitive.  So convert
    // bString to lower case when creating the attribute "value".

    for (var i=0; i<bLength; i++)
    {   var newButton = $("<button>");
        newButton
            .attr("value", buttons[i].toLowerCase())
            .addClass("button-theme")
            .text(buttons[i]);

        $(".button-div").append(newButton);
    }
}

function addButton()
{   // the event handler for the ADD A BUTTON button

    var bString = $("#button-to-add").val().trim();

    if (bString === "")
    {   playAudio (buzz);
        return;
    }

    var bLength = buttons.length;

    // Don't let the user create duplicate buttons.
    //
    // I want this comparison to be case insensitive (ie: "janis joplin" should not be allowed if "Janis
    // Joplin" is already in the array.) and that rules out a simple buttons.indexOf().  .indexOf() is
    // not case insensitive.  In fact there doesn't appear to be any easy way to do a case insensitive
    // comparison.
    //
    // So I need a for-loop.

    for (var i=0; i<bLength; i++)
    {   if (buttons[i].toLowerCase() === bString.toLowerCase())
        {   // It's a match...it's an error.  Let the user know and return
            playAudio (buzz);

            flashIt ($("button[value='" + bString.toLowerCase() + "']"));
            return;
        }
    }

    // The error conditions are out of the way...create a new element in buttons[] for the text entered
    // and then create a button for it

    for (var i=0; i<bLength; i++)
    {   // insert the new string into buttons[] in alphabetical order

        if (bString.toLowerCase() < buttons[i].toLowerCase())
        {   var tString = buttons[i];
            buttons[i] = bString;
            bString = tString;
        }
    }

    buttons.push(bString);

    playAudio (ting);

    displayButtons ();

    $("#button-to-add").val("");

    // and the last thing I want to do is save buttons[] to localStorage
    localStorage.setItem ("buttons", buttons);
}

function formatDate (date)
{   // convert the date to a friendlier format

    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var formatted = months[date.substring(5, 7) - 1] + " " +
                    date.substring(8, 10) + ", " +
                    date.substring(0, 4);

    return formatted;
}

function getBandsInTown (artist)
{   // interface with BandsInTown.com to get data for the band.  I'm thinking websites and upcoming
    // tour dates.

    var URL = "https://rest.bandsintown.com/artists/" +
        artist +
        "?app_id=codingbootcamp";

    $.get(URL)
    .then (function(response)
    {   //

        if (response.facebook_page_url)
        {   // The artist has a FaceBook page...and a link
            
            var newLink = $("<a>");

            newLink
                .addClass("button-theme")
                .attr("href", response.facebook_page_url)
                .text(artist + " on FaceBook");
            
//             $("#image-main").prepend(newLink);
            $(".button-bar").prepend(newLink);
        }

        if (response.upcoming_event_count > 0)
        {   // The artist has upcoming events (concerts?)...get the dates and display them

            var newDiv = $("<div>");

            URL = "https://rest.bandsintown.com/artists/" +
                artist +
                "/events?app_id=codingbootcamp";

            $.get(URL)
            .then (function(response)
            {   // display upcoming tour dates for events in Ohio and nearby states

                // first, clear any data that might be in #concert-div from another query
                $("#concert-div").empty();

                var dateInRegion = false;
                var divTag = $("<div>");

                response.forEach(function(concert)
                {   if ((concert.venue.country) &&
                        (concert.venue.country === "United States"))
                    {   // I'm only interested in concerts in Ohio and the surrounding states
                        //
                        // Bands In Town gives latitude and longitude for the venue, so it should
                        // be possible to calculate the distance from the users location to the
                        // venue, which would make the page more useable (ans may be even more accurate)
                        // -- but that's beyond the scope of this project.

                        var region = ["IN", "KY", "MI", "NY", "OH", "PA", "WV"];

                        if (region.indexOf (concert.venue.region) != -1)
                        {   dateInRegion = true;

                            var pTag1 = $("<p>");
                            pTag1
                                .text(concert.venue.city +
                                      ", " + concert.venue.region +
                                        " on " + formatDate (concert.datetime)); 

                            divTag
                                .append (pTag1);
                        }
                    }
                })

                if (dateInRegion)
                {   var h2Tag = $("<h2>");
                    h2Tag.text(artist + " will be appearing in:");

                    $("#concert-div")
                        .append(h2Tag)
                        .append(divTag);

                    // Concert data is in a <div> that is hidden by default.  Add a button to the
                    // page to tell the user there are concert dates to view and lets them view those
                    // dates.

                    var button = $("<button>");

                    button
                        .addClass("event-button button-theme")
                        .attr("value", "concert")
                        .text("UPCOMING CONCERTS");

//                     $("#image-main").prepend (button);
                    $(".button-bar").prepend (button);

                    // and add a button to #concert-div so the user can get that off the screen

                    button = $("<button>");

                    button
                        .addClass("event-close")
                        .text("CLOSE");

                    $("#concert-div").append (button);
                }
            })
        }
    })
    .catch()
    {   // something didn't work right.  Maybe this is an error -- maybe there is no data for this
        // artist
    }
}

function doStars (imageID, numStars)
{   // this is the code that makes stars solid or outlined for the favorites bar.  It takes parameters:
    //
    // imageID      GIPHY's unique id for the image.  This ID is saved as an attribute in the <i> tag
    //              that contains the stars and used in the jQuery selector to identify the row of stars
    //              the user has clicked on
    // numStars     Each star in the favorite's bar has been assigned a number from 0 to 4 used to
    //              identify which star in the row was clicked on.  It represents how much the user
    //              likes this image.
    //
    // I'm using Font Awesome icons for outlined and solid stars.  The class used to identify a hollow
    // star is "far fa-star" and a solid star is "fas fa-star".

    // first set all of the <i> tag elements in the selection to display Font Awesome's outlined star
    // icon.  Font Awesome recommends using the <i> tag to include their icons in HTML 

    var iTag = $(".favorites[image=" + imageID + "]");

    iTag
        .removeClass("fas fa-star")
        .addClass("far fa-star");

    // next set all of the <i> tag elements with a value of stars <= numStars to a solid star.  jQuery
    // doesn't recognize selectors using "<" (less than the indicated value) only "=" (equal to the
    // indicated value).  So since I only want the star that the user clicked on and the stars to its
    // left, I need a loop

    for (var i=0; i<= numStars; i++)   
    {   var iTag = $(".favorites[image=" + imageID + "][star=" + i  + "]");
        iTag
            .removeClass("far fa-star")
            .addClass("fas fa-star");
    }
}

function getStars (imageID)
{

}

function makeFavoriteBar (imgId)
{   // Creates a row of 5 stars to indicate the users personal preference for the image.  By default
    // stars are hollow, indicating no preferences.

    var starDiv = $("<div>");
    var numStars = 0;

    // Initialize the favorites bar (all stars are empty).  We'll call getStars() later, to fill in the
    // stars that should be

    for (var j=0; j<5; j++)
    {   var classToAdd = "far fa-star";
        var iTag = $("<i>");
 
        iTag
            .addClass(classToAdd)
            .addClass("favorites")
            .attr("image", imgId)
            .attr("star", j)
            .css("color", "gold");

        starDiv
            .append (iTag);
    }

    starDiv
        .css("bottom", "0px")
        .css("position", "absolute");
     
    getStars (imgId);

    return starDiv;
}

function getGIPHY (getWhat, offset)
{   // interface with GIPHY to retrieve images

    if (offset === undefined) offset = 0;
    // remove the GET MORE button.  The GET MORE button is the last thing added to #image-main by this
    // function and should always be the last child.  The only time GET MORE is not the last child is when
    // #image-main is empty.
    //
    // All well and good, but that doesn't seem to work...grab the button by it's class name

    $(".ten-more").remove();

    // create the search string
    var URL = "http://api.giphy.com/v1/gifs/search?q=" + getWhat +
        "&api_key=" + myAPIKey +
        "&limit=10&offset=" + offset;

    // and search GIPHY
    $.get(URL)
    .then( function(response)
    {   // got data from GIPHY...now process it

        response["data"].forEach(function(thisGIF)
        {   // for each image returned by the search, create a new <DIV> to hold that image and any
            // associated data

            var newImg = $("<img>");
            newImg
                .addClass("image")
                .attr("src", thisGIF.images.fixed_height_still.url)
                .attr("srcStill", thisGIF.images.fixed_height_still.url)
                .attr("srcRun", thisGIF.images.fixed_height.url);

            var p1 = $("<p>");
            p1
                .css("fontWeight", "bold")
                .text(thisGIF.title);

            var p2 = $("<p>");
            if (thisGIF.username)
                p2.text("created by " + thisGIF.username);
            else
                p2.empty();

            var p3 = $("<p>");
            p3
                .text(thisGIF.create_datetime);

            var p4 = $("<p>");
            p4
                .text("rated: " + thisGIF.rating);
        
            var textDiv = $("<div>");

            textDiv
                .addClass("image-div")
//                 .append(newImg)
                .append(p1)
                .append(p2)
                .append(p3)
                .append(p4)
                .append(makeFavoriteBar(thisGIF.id))
                .css("float", "left")
                .css("position", "relative");

            var wrapperDiv = $("<div>");
            wrapperDiv
                .append(newImg)
                .append(textDiv)
                .css("float", "left")

            $("#image-main")
                .append(wrapperDiv);
        })

        // add a button to get 10 more GIFs
        //
        // because of the floats, this button has to be in a div

        var button = $("<button>");
        button
            .addClass ("ten-more button-theme")
            .attr("offset", (offset * 1) + 10)
            .attr("value", getWhat)
            .text("GET 10 MORE");

        var div = $("<div>");
        div
            .append(button)
            .css("clear", "both")
    
        $("#image-main")
            .append(div);

        // and now, get info on the band...but only do it once, when the first 10 images are loaded

        if (offset === 0)
            getBandsInTown (getWhat);
    })
    .catch(function()
    {   // some kind of error occured...can't display any images

        var newP = $("<p>");
        newP
            .text("An error occured and we are unable to display .GIFs for " + getWhat);

        $("#image-div").append(newP);
    });
}

function addFavorites (imageID, numStars)
{   // The event handler for clicks in the favorites bar.  This function updates the array favorites[]
    // as well as localStorage

    // first, display the favorites bar with the number of stars indicated
    doStars (imageID, numStars);

    // If this image is already in the array favorites[] we'll update that element rather than create
    // a new one

    var found = false;

    favorites.forEach (function (item)
    {   if (item.id === imageID)
        {   found = true;
            item.rating = numStars;
        }
    })

    // and only create a new element in favorites[] if the imageID wasn't found there

    if (!found)
    {   var image =
        {   id: imageID,
            rating: numStars
        }

        favorites.push (image);
    }

    // But no matter what, update localStorage
    // convert objects in favorites[] to strings so I can write to localStorage

    var favToWrite = [];

    favorites.forEach(function (obj)
    {   favToWrite.push(JSON.stringify(obj));
    })

    // and write the converted favorites[] to localStorage

    localStorage.setItem("favorites", favToWrite);
}

$(document).ready(function()
{   getFavorites();
    getButtons();
    displayButtons ();

    $("#add-button").click(addButton);

    $(".button-div").on ("click", "button", function()
    {   // generic event handler for topic buttons

        // This is the event handler for the topic buttons.  That means the user clicked on one of the
        // buttons located in .button-div.  Whether this button is the same as the one just previously
        // clicked or not, it's okay to clear anything currently displayed in #image-div or #concert-div
        $("#image-main").empty();

        var barDiv = $("<div>");
        barDiv.addClass("button-bar");

        $("#image-main")
            .append(barDiv);

            $("#concert-div").empty();

        // and get data for the button that was clicked
        getGIPHY ($(this).text());
    });

    $("#concert-div")
        .on("click", ".event-close", function()
        {   // event handler for CLOSE button in #concert-div

            $("#concert-div").css("display", "none");
        })

    $("#image-main")
        .on("click", ".event-button", function()
        {   // event handler for UPCOMING EVENTS button

            $("#concert-div").css("display", "block");
        })
        .on("click", ".ten-more", function()
        {   // generic event handler for topic buttons

            getGIPHY ($(this).attr("value"), $(this).attr("offset"));
        })
        .on("mouseenter", ".image", function()
        {   // It appears jQuery does not support a single method for "hover", but rather uses
            // .mouseenter() end .mouseleave() events.  (Actually jQuery does have a .hover()
            // method, bit it requires separate handlers for .mouseenter() and .mouseleave()
            // any way.)

            $(this).attr("src", $(this).attr("srcRun"));
        })
        .on("mouseleave", ".image", function()
        {
            $(this).attr("src", $(this).attr("srcStill"));
        })
        .on("click", ".favorites", function()
        {   // generic event handler for clicks in the "favorites" bar
            addFavorites($(this).attr("image"), $(this).attr("star"));
//             doStars ($(this).parent(), $(this).attr("star"));
//             doStars ($(this).attr("image"), $(this).attr("star"));
        });
})