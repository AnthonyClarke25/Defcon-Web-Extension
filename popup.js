var bg = chrome.extension.getBackgroundPage();
var first = bg.firstline;
var crit = bg.critical;
var second = bg.secondline;
var recall = bg.recalls;
var openTicketCount = bg.openTicketCount;

document.getElementById('firstline').innerHTML = first;
document.getElementById('secondline').innerHTML = second;
document.getElementById('recalls').innerHTML = recall;
document.getElementById('critical').innerHTML = crit;
//The calculation that decides what defcon levels the number of active tickets brings us to.
function defconlevel(openTicketCount) {

    if (openTicketCount >= 100) {
        document.getElementById('defcon2').src = "images/DEFCON/0.png";
        document.getElementById('openTicketCount0').innerHTML = openTicketCount;
    } else if (openTicketCount > 84 && openTicketCount <= 99) {
        document.getElementById('defcon2').src = "images/DEFCON/1.png";
        document.getElementById('openTicketCount1').innerHTML = openTicketCount;
    } else if (openTicketCount > 69 && openTicketCount <= 84) {
        document.getElementById('defcon2').src = "images/DEFCON/2.png";
        document.getElementById('openTicketCount2').innerHTML = openTicketCount;
    } else if (openTicketCount > 54 && openTicketCount <= 69) {
        document.getElementById('defcon2').src = "images/DEFCON/3.png";
        document.getElementById('openTicketCount3').innerHTML = openTicketCount;
    } else if (openTicketCount > 40 && openTicketCount <= 54) {
        document.getElementById('defcon2').src = "images/DEFCON/4.png";
        document.getElementById('openTicketCount4').innerHTML = openTicketCount;
    } else {
        document.getElementById('defcon2').src = "images/DEFCON/5.png";
        document.getElementById('openTicketCount5').innerHTML = openTicketCount;
    }
}

defconlevel(openTicketCount);

//allow links in pop up to open a new chrome tab
document.addEventListener('DOMContentLoaded', function() {
    var links = document.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
        (function() {
            var ln = links[i];
            var location = ln.href;
            ln.onclick = function() {
                chrome.tabs.create({ active: true, url: location });
            };
        })();
    }
});