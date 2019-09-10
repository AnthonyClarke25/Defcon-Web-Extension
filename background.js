var firstline;
var secondline;
var critical;
var oldcritical;
var recalls;
var openTicketCount;
var oldCount;
var currentDefcon;
var previousDefcon;

//The function that connects to the db to grab the count of the search url provided in another function
async function poolnumbers(url) {
    const res = await fetch(url, {
        headers: {
            "Authorization": "Bearer "
        }
    });

    let data = await res.json();
    data = data["@odata.count"];
    return data;
}

// Assigns the poolnumber counts to variables 
async function assignnumbers() {
    firstline = await poolnumbers("https://api-v1.prospect365.com/Problems?$expand=ProblemRecall&$filter=(StatusId eq 'New' or StatusId eq 'ACCMGT') and StatusFlag ne 'D' and (ProblemRecall/RecallDate le " + new Date().toISOString().split("T")[0] + "T23:00:00Z or ProblemRecall eq null)&$count=true&$top=0");

    secondline = await poolnumbers("https://api-v1.prospect365.com/Problems?$expand=ProblemRecall&$filter=(StatusId eq '2NDLNE' or StatusId eq 'EMM') and StatusFlag ne 'D' and (ProblemRecall/RecallDate le " + new Date().toISOString().split("T")[0] + "T23:00:00Z or ProblemRecall eq null)&$count=true&$top=0");
    critical = await poolnumbers("https://api-v1.prospect365.com/Problems?$expand=Status,ProblemRecall&$filter= statusflag ne 'D' and priority eq 1 and (StatusId eq 'WORK' or StatusId eq '2NDLNE' or StatusId eq 'AWAITU' or StatusId eq 'BUG' or StatusId eq 'DEVWAI' or StatusId eq 'NEW') and (Type1Id ne 'OPRROJ' and Type1Id ne 'INTERN' and Type1Id ne 'ACCQRY') and status/DeadFlag ne 1 and (ProblemRecall/RecallDate le " + new Date().toISOString().split("T")[0] + "T23:00:00Z or ProblemRecall eq null) &$count=true &$top=0");

    await chrome.browserAction.setBadgeText({ "text": critical.toString() });
    await chrome.browserAction.setBadgeBackgroundColor({ color: "red" });

    recalls = await poolnumbers("https://api-v1.prospect365.com/Problems?$expand=ProblemRecall($expand=RecallUser),Status&$filter=StatusFlag ne 'D' and ProblemRecall/RecallDate le " + new Date().toISOString().split("T")[0] + "T23:00:00Z  and (StatusId ne 'NEW' and StatusId ne '2NDLNE' and StatusId ne 'ACCMGT') and ProblemRecall/RecallUser/Dictionary/DictionaryCode eq 'SUPPORT'&$top=0&$count=true");

    openTicketCount = await firstline + await secondline + await recalls;

}

// Notification of new critical issues

async function criticalnotification() {
    await assignnumbers();
    await setDefconLevel();

    if (typeof critical === "undefined") {
        console.log("undefined");
        critical = oldcritical;
    } else if (oldcritical < critical || typeof oldcritical === "undefined") {
        var criticalnotifiOptions = {
            type: 'basic',
            iconUrl: 'images/1-128.png',
            title: 'New Critical Problem',
            message: "We have a new critical issue in the pools! This brings the pool total to " + critical + "!"
        };
        console.log("we have a critical. The older value is " + oldcritical + "and the current value is " + critical);

        chrome.notifications.create(criticalnotifiOptions, callback);

        function callback() {
            console.log("Last error:", chrome.runtime.lastError);
        }
    }
    oldcritical = critical;

}

async function defconZeroNotification() {
    if (typeof currentDefcon === "undefined") {
        currentDefcon = previousDefcon;
    } else {
        if (previousDefcon !== 0 && previousDefcon > 0 || typeof previousDefcon === "undefined") {
            var zeronotifiOptions = {
                type: 'basic',
                iconUrl: 'images/0-128.png',
                title: 'DEFCON 0 Reached.',
                message: "We have reached DEFCON 0. CSM team will come out of the phone queue. Sales & Marketing and Account Management will manage phones. Current Devtecting team will help clear down the Service Desk Pool."
            };

            chrome.notifications.create(zeronotifiOptions, callback);

            function callback() {
                console.log("Last error:", chrome.runtime.lastError);
            }
        }
        previousDefcon = currentDefcon;
    }
}

async function defconThreeNotification() {


    if (typeof currentDefcon === "undefined") {
        currentDefcon = previousDefcon;

    } else if (previousDefcon !== 3 && previousDefcon > 3 || typeof previousDefcon === "undefined") {
        var threenotifiOptions = {
            type: 'basic',
            iconUrl: 'images/3-128.png',
            title: 'DEFCON 3 Reached',
            message: "We have reached DEFCON 3. Please focus on the pools."
        };
        chrome.notifications.create(threenotifiOptions, callback);

        function callback() {
            console.log("Last error:", chrome.runtime.lastError);
        }

        previousDefcon = currentDefcon;




    }
}


//make the notification take you to the critical dashboard
chrome.notifications.onClicked.addListener(function(notificationId, byUser) {
    chrome.tabs.create({ url: "http://dashboards.prospectsoft.local/crm/index.php?tab=critical" });
});

//fire refresh of data after page load
chrome.runtime.onInstalled.addListener(() => {
    criticalnotification(); // the initial call to the api
    chrome.alarms.create('refresh', { periodInMinutes: 2 }); // create alarm after extension is installed / upgraded
});

chrome.alarms.onAlarm.addListener((alarm) => {
    console.log(alarm.name); // refresh
    criticalnotification();
});

// Change the badge icon based on the number of tickets in the pools

async function setDefconLevel() {

    if (await openTicketCount >= 100) {
        currentDefcon = 0;
        defconZeroNotification();
    } else if (await openTicketCount > 84 & await openTicketCount <= 99) {
        currentDefcon = 1;
    } else if (await openTicketCount > 69 & await openTicketCount <= 84) {
        currentDefcon = 2;
    } else if (await openTicketCount > 54 & await openTicketCount <= 69) {
        currentDefcon = 3;
        defconThreeNotification();
    } else if (await openTicketCount > 40 & await openTicketCount <= 54) {
        currentDefcon = 4;
    } else {
        currentDefcon = 5;
    };
    changeicon(); // changes the icon on the extensions based on the total of the values
}

function changeicon() {
    chrome.browserAction.setIcon({
        path: {
            "16": "images/" + currentDefcon + "-16.png",
            "48": "images/" + currentDefcon + "-48.png",
            "128": "images/" + currentDefcon + "-128.png",
        }
    });
}