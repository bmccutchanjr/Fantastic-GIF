var buttons = [];           // array of buttons
var imageURLs = [];         // array of objects containing the URL for still and animated images
var GIPHYoffset = 0;        // first image to tetrieve from GIPHY
const stillImage = 0;       // index to the still image in imageURLs
const runImage = 1;         // index to the running image in imageURLs

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

    var color = "white";
    if ((num % 2) != 0) color = "blue";

    $(elem).css("background-color", color);

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
            .addClass("something")
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
                .addClass("something")
                .attr("href", response.facebook_page_url)
                .text(artist + " on FaceBook");
            
            $("#image-main").prepend(newLink);
        }

        if (response.upcoming_event_count > 0)
        {   // The artist has upcoming events (concerts?)...get the dates and display them

            var newDiv = $("<div>");

            URL = "https://rest.bandsintown.com/artists/" +
                artist +
                "/events?app_id=codingbootcamp";

            $.get(URL)
            .then (function(response)
            {   // display upcoming tour dates for Akron, Cleveland and Youngstown

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
                        .prepend(h2Tag)
                        .append(divTag);

                    // Concert data is in a <div> that is hidden by default.  Add a button to the
                    // page to tell the user there are concert dates to view and lets them view those
                    // dates.

                    var cButton = $("<button>");

                    cButton
                        .addClass("something")
                        .attr("value", "concert")
                        .text("UPCOMING CONCERTS");

                    $("#image-main").prepend (cButton);
                }
            })
        }
    })
    .catch()
    {   // something didn't work right.  Maybe this is an error -- maybe there is no data for this
        // artist
    }
}

function getGIPHY (getWhat)
{   // interface with GIPHY to retrieve images

    // remove the GET MORE button.  The GET MORE button is the last thing added to #image-main by this
    // function and should be the last child.  The only time GET MORE is not the last child is when
    // #image-main is empty.

    $("#image-main:last-child").remove();

    // create the search string
    var URL = "http://api.giphy.com/v1/gifs/search?q=" + getWhat +
        "&api_key=" + myAPIKey +
        "&limit=10&offset=" + GIPHYoffset;

    // and search GIPHY
    $.get(URL)
    .then( function(response)
    {   // got data from GIPHY...now process it

        response["data"].forEach(function(thisGIF)
        {   // for each image returned by the search, create a new <DIV> to hold that image and any
            // associated data

            var imgArray = 
            [   thisGIF.images.fixed_height_still.url,
                thisGIF.images.fixed_height.url,
            ];
            imageURLs.push (imgArray);

            var newImg = $("<img>");
            newImg
                .addClass("image")
                .attr("src", imgArray[stillImage])
                .attr("value", imageURLs.length - 1);

            var ratedP = $("<p>");
            ratedP
                .text("rated: ");

            var newDiv = $("<div>");
            newDiv
                .addClass("image-div")
                .append(newImg)
                .append(ratedP);

            $("#image-main").append(newDiv);
        })

        // add a button to get 10 more GIFs
        var button = $("<button>");
        button
            .addClass ("10-more")
            .attr("value", getWhat)
            .text("GET 10 MORE");

        $("#image-main")
            .append(button);

        // and now, get info on the band...but only do it once

        if (GIPHYoffset === 0)
            getBandsInTown (getWhat);
    })
    .catch(function()
    {   // some kind of error occured...can't display any images

        var newP = $("<p>");
        newP
            .text("An error occured and we are unable to display .GIFs for " + $(getWhat).attr("value"));

        $("#image-div").append(newP);
    });
}

$(document).ready(function()
{   getButtons();
    displayButtons ();

    $("#add-button").click(addButton);

    $(".button-div").on ("click", "button", function()
    {   // generic event handler for topic buttons

        // This is the event handler for the topic buttons.  That means the user clicked on one of the
        // buttons located in .button-div.  Whether this button is the same as the one just previously
        // clicked or not, it's okay to clear anything currently displayed in #image-div or #concert-div
    
        $("#image-main").empty();
        $("#concert-div").empty();
        imageURLs = [];
        GIPHYoffset = 0;

        // and get data for the button that was clicked
        getGIPHY ($(this).text());
    });

    $("#image-main")
        .on("click", ".10-more", function()
        {   // generic event handler for topic buttons

            GIPHYoffset += 10;
            getGIPHY ($(this).attr("value"));
        })
        .on("mouseenter", ".image", function()
        {   // It appears jQuery does not support a single method for "hover", but rather uses
            // .mouseenter() end .mouseleave() events.  (Actually jQuery does have a .hover()
            // method, bit it requires separate handlers for .mouseenter() and .mouseleave()
            // any way.)

            $(this).attr("src", imageURLs[$(this).attr("value")] [runImage]);
        })
        .on("mouseleave", ".image", function()
        {   $(this).attr("src", imageURLs[$(this).attr("value")] [stillImage]);
        });

})