const salaryInput = document.getElementById("salary");
const worthMyHourToggle = document.getElementById("showWorthMyHour");
const customMessageInput = document.getElementById("customMessage");
const textColorInput = document.getElementById("textColor");
const bgColorInput = document.getElementById("bgColor");
const borderColorInput = document.getElementById("borderColor");
const textColorPreview = document.getElementById("textColorPreview");
const bgColorPreview = document.getElementById("bgColorPreview");
const borderColorPreview = document.getElementById("borderColorPreview");
const saveButton = document.getElementById("save");
const statusDiv = document.getElementById("status");

function updateColorPreviews(){
    textColorPreview.style.backgroundColor = textColorInput.value;
    bgColorPreview.style.backgroundColor = bgColorInput.value;
    borderColorPreview.style.backgroundColor = borderColorInput.value;
}
textColorInput.addEventListener("input",updateColorPreviews);
bgColorInput.addEventListener("input",updateColorPreviews);
borderColorInput.addEventListener("input",updateColorPreviews);

function toggleCustomMessageVisibility() {
    customMessageInput.parentElement.style.display = worthMyHourToggle.checked
      ? "block"
      : "none";
  }

worthMyHourToggle.addEventListener("change", toggleCustomMessageVisibility);

chrome.storage.sync.get(
    [
      "hourlyWage",
      "WorthMyHour",
      "customMessage",
      "textColor",
      "bgColor",
      "borderColor",
    ],
    function(result){
        if (result.hourlyWage) {
            salaryInput.value = result.hourlyWage;
          }      
        worthMyHourToggle.checked = result.worthMyHour !== undefined ? result.worthMyHour : true;
        customMessageInput.value = result.customMessage || "of your life";

        textColorInput.value = result.textColor || "white";
        bgColorInput.value = result.bgColor || "black";
        borderColorInput.value = result.borderColor || "white";
        updateColorPreviews();
        toggleCustomMessageVisibility();
    }
);

saveButton.addEventListener("click",() => {
    const salaryValue = parseFloat(salaryInput.value());
    if(salaryValue && salaryValue > 0){
        chrome.storage.sync.set(
        {
            hourlyWage:salaryValue,
            worthMyHour:worthMyHourToggle.checked,
            customMessage:customMessageInput.value,
            textColor:textColorInput.value,
            bgColor:bgColorInput.value,
            borderColor:borderColorInput.value
        },
        ()=>{
            statusDiv.textContent = "Settings saved!";
            setTimeout(()=>{
            statusDiv.textContent="";
            },2000);
        }
        );
    }
    else{
    statusDiv.textContent = "Please enter a valid wage > 0.";
        setTimeout(() => {
        statusDiv.textContent = "";
        }, 3000);
    }
});