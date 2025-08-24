let hourlyWage = null;
let worthMyHour = true; // Default to true
let customMessage = "of your life"; // Default message
let textColor = "white"; // Default text color
let bgColor = "black"; // Default background color
let borderColor = "white"; // Default border color
const processedMark = "worthMyHour-processed"; // Mark elements we've already handled
const hoursSpanClass = "worthMyHour-hours"; // Class for our added span

function addStyles(){
    const existingStyle = document.getElementById("worthMyHour-styles");
    if(existingStyle){
        existingStyle.remove();
    }
    const styleEl = document.createElement("style");
    styleEl.id = "worthMyHour-styles";
    styleEl.textContent = `
    .${hoursSpanClass} {
    font-size: 0.9em;
    margin-left: 5px;
    background-color: ${bgColor};
    color: ${textColor};
    padding: 2px 5px;
    border-radius: 15px;
    box-shadow: 0 0 0 1px ${borderColor};
    max-height:fit-content;
    align-self: center;
    }
    `;
    document.head.appendChild(styleEl);
}
function clearExistingTimeSpans() {
  // Remove all time cost spans added by this extension
  document
    .querySelectorAll(`.${hoursSpanClass}`)
    .forEach((span) => span.remove());
  // Remove the processed mark from elements to allow reprocessing
  document
    .querySelectorAll(`.${processedMark}`)
    .forEach((el) => el.classList.remove(processedMark));
}

let pageObserver = null;

function runLifePrice() {
  // Disconnect previous observer if running (e.g., during wage update)
  if (pageObserver) {
    pageObserver.disconnect();
    pageObserver = null;
  }
  // Clear existing time spans before re-running
  clearExistingTimeSpans();

  const hostname = window.location.hostname;
  let scanFunction;
  let isAmazon = hostname.includes("amazon."); // Basic check

  if (isAmazon) {
    scanFunction = scanForPrices_Amazon;
  } else {
    scanFunction = scanForPrices_Generic;
  }

  // Initial scan
  if (hourlyWage && hourlyWage > 0) {
    // Only scan if wage is valid
    scanFunction(document.body);
  }

  
}
function initialize() {
    // Your initialization code here   
    chrome.storage.sync.get(
    [
        "hourlyWage",
        "worthMyHour",
        "customMessage",
        "textColor",
        "bgColor",
        "borderColor",
    ],
    function(result){
        if (result.hourlyWage && result.hourlyWage > 0) {
        hourlyWage = result.hourlyWage;      
        worthMyHour = result.worthMyHour !== undefined ? result.worthMyHour : true;
        customMessage = result.customMessage || "of your life";
        textColor = result.textColor || "white";
        bgColor = result.bgColor || "black";
        borderColor = result.borderColor || "white";
        addStyles();
        setTimeout(runLifePrice,500);
        }else{
            console.warn( "LifePrice: Hourly wage not set or invalid in storage. Value:",
          result.hourlyWage);
          clearExistingTimeSpans();
        }
    }
    );
}

initialize();

