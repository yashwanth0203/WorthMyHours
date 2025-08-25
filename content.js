let hourlyWage = null;
let worthMyHour = true; // Default to true
let customMessage = "of your life"; // Default message
let textColor = "white"; // Default text color
let bgColor = "black"; // Default background color
let borderColor = "white"; // Default border color
const processedMark = "worthMyHour-processed"; // Mark elements we've already handled
const hoursSpanClass = "worthMyHour-hours"; // Class for our added span

// Removes all previously injected time cost spans and processed marks.
// This is needed to refresh the page display after settings change or re-scan.
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

function formatTimeCost(priceValue, wage) {
    if(wage <= 0)return "";
    const timeinHours = priceValue / wage;
    if(timeinHours >= 1){
        const hours = timeinHours.toFixed(1);
        const unit = hours == 1 ? "hour" : "hours";
        return `${hours} ${unit}`;
    }
    else if(timeinHours >= 1/60){
        const minutes = Math.round(timeinHours * 60);
        const unit = minutes == 1 ? "minute" : "minutes";
        return `${minutes} ${unit}`;
    }
    else{
        const seconds = Math.round(timeinHours * 3600);
        const unit = seconds == 1 ? "second" : "seconds";
        return `${seconds} ${unit}`;
    }
}
const genericPriceRegex =
  /([\$£€₹])(\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?))/;

function updateTimeCostForTextNode(textNode) {
  if (!hourlyWage || hourlyWage <= 0 || textNode.nodeType !== Node.TEXT_NODE) {
    return;
  }

  const parentElement = textNode.parentElement;
  // Only proceed if the parent element EXISTS and WAS previously processed by us
  if (!parentElement || !parentElement.classList.contains(processedMark)) {
    return;
  }

  // Find the existing hours span (should be the next sibling element)
  const existingHoursSpan = parentElement.nextElementSibling;
  if (
    !existingHoursSpan ||
    !existingHoursSpan.classList.contains(hoursSpanClass)
  ) {
    // This shouldn't happen if the parent is marked, but good to check
    console.warn(
      "LifePrice (Update): Marked parent found, but no adjacent hoursSpan:",
      parentElement
    );
    // Optional: We could try to re-run calculateAndAppendHours_Generic here as a fallback
    // calculateAndAppendHours_Generic(textNode); // Be careful, might re-trigger loop if not handled well
    return;
  }

  // Now, re-evaluate the text node's current content
  const text = textNode.nodeValue;
  genericPriceRegex.lastIndex = 0; // Reset regex state
  const match = genericPriceRegex.exec(text);
  let timeText = ""; // Default to empty

  if (match) {
    const priceString = match[2].replace(/,/g, "");
    const priceValue = parseFloat(priceString);

    if (!isNaN(priceValue) && priceValue > 0) {
      const formattedTime = formatTimeCost(priceValue, hourlyWage);
      timeText = formattedTime
        ? ` ${formattedTime}${showLifeText ? ` ${customMessage}` : ""}`
        : "";
    }
  }

  // Update or remove the existing span
  if (timeText) {
    existingHoursSpan.textContent = timeText;
  } else {
    try {
      existingHoursSpan.remove();
      // Optional: We could remove the processedMark from the parent too,
      // but leaving it might be fine unless the element structure changes drastically.
      // parentElement.classList.remove(processedMark);
    } catch (e) {
      console.error(
        "LifePrice (Update): Error removing hoursSpan:",
        e,
        existingHoursSpan
      );
    }
  }
}

function calculateAndAppendHours_Generic(textNode) {
    if (!hourlyWage || hourlyWage <= 0 || textNode.nodeType !== Node.TEXT_NODE) {
        return;
    }
    const parentElement = textNode.parentElement;
    if (!parentElement) return;
    if (parentElement.classList.contains(processedMark) || 
        parentElement.nextElementSibling?.classList.contains(hoursSpanClass)) {
        return;
    }
    const parentTag = parentElement.tagName?.toUpperCase();
    if (parentTag === "SCRIPT" || parentTag === "STYLE" || parentElement.classList.contains(hoursSpanClass)) {
            return;
        }     
    const text = textNode.nodeValue;
    genericPriceRegex.lastIndex = 0; // Reset regex state
    const match = genericPriceRegex.exec(text);
    if (match) {
    const fullMatch = match[0]; // e.g., "$20 (14 mins of your life)"
    const priceString = match[2].replace(/,/g, "");
    const priceValue = parseFloat(priceString);

    if (!isNaN(priceValue) && priceValue > 0) {
      const formattedTime = formatTimeCost(priceValue, hourlyWage);
      const timeText = formattedTime
        ? ` ${formattedTime}${showLifeText ? ` ${customMessage}` : ""}`
        : "";

      if (timeText) {
        const hoursSpan = document.createElement("span");
        hoursSpan.textContent = timeText;
        hoursSpan.classList.add(hoursSpanClass); // Use specific class for time span

        try {
          // Insert the time span AFTER the parent element containing the text node
          parentElement.insertAdjacentElement("afterend", hoursSpan);
          parentElement.classList.add(processedMark); // Mark the PARENT element
        } catch (e) {
          console.error(
            "LifePrice (Generic Initial): Error inserting hoursSpan:",
            e,
            "after element:",
            parentElement
          );
        }
      }
    }
  }
}
function scanForPrices_Generic(targetNode){
    const walker = document.createTreeWalker(targetNode,NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node){
                const parent = node.parentElement;
                if(!parent)return NodeFilter.FILTER_REJECT;
                const parentTag = parent.tagName?.toUpperCase();
                if(parentTag === "SCRIPT" || parentTag === "STYLE" || parent.classList.contains(hoursSpanClass)
                ||parent.closest(`.{$hoursSpanClass}`)){
                    return NodeFilter.FILTER_REJECT;
                }
                if (parent.classList.contains(processedMark) || 
                parent.nextElementSibling?.classList.contains(hoursSpanClass)) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (node.nodeValue && /[$\£€₹]\s?\d/.test(node.nodeValue)) {
                        return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
            },
        },
        false
    );
    const nodesToProcess = [];
    let node;
    while ((node = walker.nextNode())) {
        nodesToProcess.push(node);
    }
    nodesToProcess.forEach(calculateAndAppendHours_Generic);
}

const amazonPriceContainerSelector = "span.a-price";

function calculateAndAppendHours_Amazon(priceContainer) {
    if (!hourlyWage || hourlyWage <= 0) return;
    if (
    priceContainer.classList.contains(processedMark) ||
    priceContainer.nextElementSibling?.classList.contains(hoursSpanClass)
  ) {
    return;
  }
  // Extract all text content to find price
  let priceText = priceContainer.textContent || "";
  priceText = priceText.replace(/[^0-9\.\$£€₹\s]/g, "").trim();
  const match = /[\$£€₹]\s?(\d+(?:\.\d{1,2})?)/.exec(priceText);

  if (match && match[1]) {
    const priceValue = parseFloat(match[1]);
    if(!isNaN(priceValue) && priceValue > 0){
        const formattedTime = formatTimeCost(priceValue, hourlyWage);
        const timeText = formattedTime ? `${formattedTime }${worthMyHour ? `${customMessage}` : ""}` : "";
        if(timeText){
            const hoursSpan = document.createElement("span");
            hoursSpan.textContent = timeText;
            hoursSpan.classList.add(hoursSpanClass);
        try {
          // Insert after price container
          priceContainer.insertAdjacentElement("afterend", hoursSpan);
          priceContainer.classList.add(processedMark);
        } catch (e) {
          console.error("LifePrice (Amazon): Error inserting hoursSpan:", e);
        }
    }
    }
  }
}
function scanForPrices_Amazon(targetNode) {
// We process prices in two ways:
// 1. scope.querySelectorAll(...) → finds any price elements inside the target node.
//    (Typical case: Amazon replaces/updates a container that holds price spans.)
// 2. If the target node itself IS a price element, scope.matches(...) will catch it.
//    (Edge case: Amazon directly replaces just the <span class="a-price"> element.)
// Without this second check, we’d miss updates where only the price span itself changes.
    let scope = targetNode.nodeType === Node.ELEMENT_NODE || Node.DOCUMENT_FRAGMENT_NODE? targetNode : document;
     try {
    const priceContainers = scope.querySelectorAll(amazonPriceContainerSelector);
    priceContainers.forEach(calculateAndAppendHours_Amazon);

    if(scope !== document && typeof scope.matches === "function" && scope.matches(amazonPriceContainerSelector)){
        calculateAndAppendHours_Amazon(scope);
     }
    } catch (e){
        console.error("LifePrice (Amazon): Error during querySelectorAll or processing:",
      e,
      "on targetNode:",
      targetNode
    );
    }
}
// Removes all previously injected time cost spans and processed marks.
// This is needed to refresh the page display after settings change or re-scan.
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

  // Observe changes - always use the chosen scan function for childList
  const observer = new MutationObserver((mutationsList) => {
    // Prevent processing if wage is not set
    if (!hourlyWage || hourlyWage <= 0) return;

    // Basic re-entrancy guard (keep existing one)
    if (observer.isProcessing) return;
    observer.isProcessing = true;

    for (const mutation of mutationsList) {
      // Handle added nodes (for completely new sections/prices)
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.classList?.contains(hoursSpanClass)
          ) {
            return; // Skip our own spans
          }
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.closest(`.${processedMark}`)
          ) {
            // If the node is added *inside* a marked container,
            // AND it's an Amazon site, we might need to re-evaluate the container
            // This addresses cases where Amazon replaces price parts internally.
            if (isAmazon) {
              const amazonContainer = node.closest(
                amazonPriceContainerSelector
              );
              if (
                amazonContainer &&
                amazonContainer.classList.contains(processedMark)
              ) {
                // Remove old span, remove mark, re-process container
                const oldSpan = amazonContainer.nextElementSibling;
                if (oldSpan && oldSpan.classList.contains(hoursSpanClass)) {
                  oldSpan.remove();
                }
                amazonContainer.classList.remove(processedMark);
                calculateAndAppendHours_Amazon(amazonContainer);
              } else if (
                node.matches &&
                node.matches(amazonPriceContainerSelector)
              ) {
                // If the added node *is* the container itself
                scanFunction(node);
              }
            }
            return; // Skip other nodes inside already marked containers
          }

          if (
            node.nodeType === Node.ELEMENT_NODE ||
            node.nodeType === Node.DOCUMENT_FRAGMENT_NODE
          ) {
            try {
              scanFunction(node); // Run initial scan logic on new nodes
            } catch (e) {
              console.error(
                "LifePrice: Error during observer scanFunction call:",
                e,
                "on node:",
                node
              );
            }
          } else if (node.nodeType === Node.TEXT_NODE && !isAmazon) {
            // If a text node is added directly, try processing its parent immediately
            // This might happen in some frameworks
            calculateAndAppendHours_Generic(node);
          }
        });
      }
      // Handle text changes within existing nodes (for price updates)
      else if (mutation.type === "characterData") {
        // Add a check to avoid processing changes within our own spans
        if (mutation.target.parentElement?.classList.contains(hoursSpanClass)) {
          continue; // Skip changes within our spans
        }

        // Check for Amazon price changes
        if (isAmazon) {
          const amazonContainer = mutation.target.parentElement?.closest(
            amazonPriceContainerSelector
          );
          // Check if the change happened within a *processed* Amazon container
          if (
            amazonContainer &&
            amazonContainer.classList.contains(processedMark)
          ) {
            // Re-evaluate this specific Amazon container
            const oldSpan = amazonContainer.nextElementSibling;
            if (oldSpan && oldSpan.classList.contains(hoursSpanClass)) {
              oldSpan.remove(); // Remove old span first
            }
            amazonContainer.classList.remove(processedMark); // Unmark
            calculateAndAppendHours_Amazon(amazonContainer); // Re-process
          }
        }
        // Handle Generic price changes (only if not handled by Amazon logic above)
        else if (mutation.target.nodeType === Node.TEXT_NODE) {
          updateTimeCostForTextNode(mutation.target);
        }
      }
    }
    observer.isProcessing = false;
  });

  observer.isProcessing = false; // Initialize flag

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true, // <-- Enable characterData observation
    characterDataOldValue: false, // We don't need the old value
  });

  // Store the observer instance so we can disconnect/reconnect if needed
  pageObserver = observer;
}
// Adds custom CSS styles for the time cost span elements injected into the page.
// This ensures the added info is visually distinct and matches user preferences.
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

chrome.storage.onChanged.addListener((changes,namespace)=>{
    if(namespace === "sync"){
        let shouldRerun = false;
        let stylesChanged = false;

        if(changes.hourlyWage){
            const newWage = changes.hourlyWage.newValue;
            const oldWage = changes.hourlyWage.oldValue;

            console.log("LifePrice: Wage changed from", oldWage, "to", newWage);
        }
        if (newWage && newWage > 0) {
            hourlyWage = newWage;
            shouldRerun = true;
        } else {
        hourlyWage = null;
        // If wage is removed or invalid, clear the time spans from the page
        clearExistingTimeSpans();
        // Optional: Disconnect observer if wage is invalid
        if (pageObserver) {
          pageObserver.disconnect();
          pageObserver = null;
        }
      }

    if (changes.worthMyHour) {
        const newWorthMyHour = changes.worthMyHour.newValue;
        console.log("LifePrice: 'Show life text' changed to", newWorthMyHour);
        showLifeText = newWorthMyHour;
        shouldRerun = true;
    }
    if (changes.customMessage) {
      const newCustomMessage = changes.customMessage.newValue;
      console.log("LifePrice: Custom message changed to", newCustomMessage);
      customMessage = newCustomMessage;
      shouldRerun = true;
    }

    // Handle color changes
    if (changes.textColor) {
      textColor = changes.textColor.newValue;
      stylesChanged = true;
    }

    if (changes.bgColor) {
      bgColor = changes.bgColor.newValue;
      stylesChanged = true;
    }

    if (changes.borderColor) {
      borderColor = changes.borderColor.newValue;
      stylesChanged = true;
    }

    // Update styles if any colors changed
    if (stylesChanged) {
      addStyles();
    }

    // Re-run if settings changed and we have a valid wage
    if ((shouldRerun || stylesChanged) && hourlyWage && hourlyWage > 0) {
      // Use timeout to prevent potential rapid firing / race conditions
      setTimeout(runLifePrice, 100); // Short delay before updating UI
    }
    }
})

initialize();

