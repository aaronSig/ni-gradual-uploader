const someCSS = `
.button-3 {
  appearance: none;
  background-color: #2ea44f;
  border: 1px solid rgba(27, 31, 35, .15);
  border-radius: 6px;
  box-shadow: rgba(27, 31, 35, .1) 0 1px 0;
  box-sizing: border-box;
  color: #fff;
  cursor: pointer;
  display: inline-block;
  font-family: -apple-system,system-ui,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji";
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  padding: 6px 16px;
  position: relative;
  text-align: center;
  text-decoration: none;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  vertical-align: middle;
  white-space: nowrap;
}

.button-3.small {
    font-size: 12px;
    padding: 2px 8px;
    margin-top: 2px;
}

.button-3.large {
    width: 100%;
    font-size: 16px;
    padding: 8px 16px;
}

.button-3:focus:not(:focus-visible):not(.focus-visible) {
  box-shadow: none;
  outline: none;
}

.button-3:hover {
  background-color: #2c974b;
}

.button-3:focus {
  box-shadow: rgba(46, 164, 79, .4) 0 0 0 3px;
  outline: none;
}

.button-3:disabled {
  background-color: #94d3a2;
  border-color: rgba(27, 31, 35, .1);
  color: rgba(255, 255, 255, .8);
  cursor: default;
}

.button-3:active {
  background-color: #298e46;
  box-shadow: rgba(20, 70, 32, .2) 0 1px 0 inset;
}

.extra {
    font-size: 12px;
    color: #666;
    margin-top: 1rem;
}

.error-alert-1 {
  background-color: #FEE;
  border: 1px solid #EDD;
  color: #A66;
  position: relative;
  top: 10;
  left: 0;
  width: auto;
  height: auto;
  padding: 10px;
  margin: 10px;
  line-height: 1.8;
  border-radius: 5px;
  cursor: hand;
  cursor: pointer;
  font-family: sans-serif;
  font-weight: 400;
}
`;

// Code to only change the upload form....
if (checkIfOnPage()) {
  resetLocalStorage();
  setTimeout(addForm, 1000);
}

let lastPage = window.location.hash;
window.addEventListener("click", function (e) {
  if (lastPage !== window.location.hash) {
    lastPage = window.location.hash;
    if (checkIfOnPage()) {
      addForm();
    } else {
      cleanup();
    }
  }
});

function checkIfOnPage() {
  return window.location.hash === "#/movements/ela/moves-out-market";
}

let docRowTemplate = `
      <div style="display: flex; flex-direction: column;">
        <div style="display: flex;">
            <span id="documentNumber" style="flex-grow: 1;"></span>
            <span id="status"></span>   
            <button class="button-3 small" role="button" style="margin-left: 1rem;" id="send">Send</button>
        </div>
        <div style="display:none;" class="error-alert-1">
            <span id="error"></span>
        </div>
      </div>
    `;

// Create our template
let template = `
 <div style="position: fixed; bottom:0px; right: 24px; width: 320px; height: 300px; background-color: white; border: 1px solid #eee; box-shadow: 2px -2px rgba(0,0,0,0.1);">

    <style>
     ${someCSS}
    </style>

     <div style="background-color: green; padding: 12px 24px; color: white; user-select: none;">
         <h3 class="panel-title">Gradually Upload A File</h3>
     </div>
     <div class="panel-body">
         <p id="intro">This uploads one movement record at a time until they're all complete to avoid the timeout errors</p>
         
         <input type="file" id="file-input-selector" name="file" accept=".xml" />

         <p id="extra-blurb" class="extra">This panel is added by a Chrome Extension developed by Aaron at MartEye</p>

         <div id="original-file-download"></div>

         <div id="status" style="display: flex; margin-top: 1rem;">
         </div>

         <div id="docs" style="display: block; margin-top: 1rem; overflow: scroll; max-height: 383px; border-top: 1px solid green; padding: 1rem 4px;">
         </div>

         <div id="footer" style="display:none; bottom: 0px; left: 0px; right: 0px; position: absolute; padding: 8px 4px;">
            <button class="button-3 large" role="button" id="autosend">Send All</button>
         </div>
     </div>
 </div>
 `;

// Create a new div element
let mainPanelDiv = document.createElement("div");
// Set the innerHTML of the div to our template
mainPanelDiv.innerHTML = template;

let docsToBeSent = [];
let trimmedDoc = null;

// Meat of the code
function addForm() {
  // Get the upload button
  let fileInput = mainPanelDiv.querySelector("#file-input-selector");
  // when the file is selected, get the contents
  fileInput.addEventListener("change", function (e) {
    let file = e.target.files[0];
    let reader = new FileReader();

    reader.onload = function (e) {
      let contents = e.target.result;
      let parser = new DOMParser();
      let _originalDoc = parser.parseFromString(contents, "text/xml");

      // XKO adds lots of whitespace we need to remove
      trimmedDoc = _originalDoc.cloneNode(true);
      trimAllNodes(trimmedDoc, "marketNumber");
      trimAllNodes(trimmedDoc, "documentNumber");
      trimAllNodes(trimmedDoc, "toHerd");
      trimAllNodes(trimmedDoc, "numAnimals");
      trimAllNodes(trimmedDoc, "animalNo");
      trimAllNodes(trimmedDoc, "lotNo");

      let vmlMessage = trimmedDoc.querySelector("VMLMessage");
      let type = vmlMessage.getAttribute("Type");
      let date = trimmedDoc.querySelector("date").textContent.trim();
      let marketNumber = trimmedDoc
        .querySelector("marketNumber")
        .textContent.trim();

      // Get movements
      let movements = Array.from(trimmedDoc.querySelectorAll("movement"));

      for (let movement of movements) {
        let doc = document.implementation.createDocument("", "", null);
        let newVMLMessage = doc.createElement("VMLMessage");
        newVMLMessage.setAttribute("Type", type);

        let newDate = doc.createElement("date");
        newDate.appendChild(doc.createTextNode(date));

        let newMarketNumber = doc.createElement("marketNumber");
        newMarketNumber.appendChild(doc.createTextNode(marketNumber));

        newVMLMessage.appendChild(newDate);
        newVMLMessage.appendChild(newMarketNumber);
        newVMLMessage.appendChild(movement.cloneNode(true)); // Deep clone the movement node

        doc.appendChild(newVMLMessage);

        let serializer = new XMLSerializer();
        let xmlStr = serializer.serializeToString(doc);

        docsToBeSent.push({
          xml: xmlStr,
          documentNumber: movement
            .querySelector("documentNumber")
            .textContent.trim(),
        });
      }

      buildDocRows();

      // remove the #extra-blurb and make the panel larger;
      mainPanelDiv.querySelector("#intro").style.display = "none";
      mainPanelDiv.querySelector("#extra-blurb").style.display = "none";
      mainPanelDiv.querySelector("#file-input-selector").style.display = "none";

      mainPanelDiv.querySelector("#footer").style.display = "block";

      mainPanelDiv.children[0].style.height = "600px";

      let screenWith = window.innerWidth;

      mainPanelDiv.children[0].style.width = `${Math.min(
        900,
        screenWith - 48
      )}px`;

      // attach a click handler to the autosend button

      let autosendButton = mainPanelDiv.querySelector("#autosend");
      if (autosendButton) {
        autosendButton.addEventListener("click", async function (e) {
          autosendButton.disabled = true;
          // Show a spinner
          autosendButton.innerHTML = `Sending...`;

          try {
            // await autosendNext();

            await sendAllAtOnce();
          } finally {
            autosendButton.disabled = false;
            autosendButton.innerHTML = `Send All`;

            buildDocRows();
          }
        });
      }

      // XKO has whitespace. Allow the user to download the file with the whitespace removed
      // get the original-file-download div
      let originalFileDownload = mainPanelDiv.querySelector(
        "#original-file-download"
      );
      originalFileDownload.innerHTML = `
        <button class="button-3 small" role="button" id="download">Download Cleaned File</button>
      `;
      let downloadButton = originalFileDownload.querySelector("#download");

      downloadButton.addEventListener("click", function (e) {
        let serializer = new XMLSerializer();
        let xmlStr = serializer.serializeToString(trimmedDoc);

        let blob = new Blob([xmlStr], { type: "text/xml" });
        let url = URL.createObjectURL(blob);

        let a = document.createElement("a");
        a.href = url;

        // append "cleaned" to the filename
        let filename = file.name;
        let dotIndex = filename.lastIndexOf(".");
        if (dotIndex !== -1) {
          filename =
            filename.substring(0, dotIndex) +
            "-cleaned" +
            filename.substring(dotIndex);
        } else {
          filename = filename + "-cleaned";
        }

        a.download = filename;
        a.click();
      });
    };

    reader.readAsText(file);
  });

  document.body.appendChild(mainPanelDiv);
}

let idsSending = [];

function buildDocRows() {
  //   Create the document rows
  let docs = mainPanelDiv.querySelector("#docs");
  docs.style.display = "block";
  docs.innerHTML = "";

  let totalSent = 0;
  let errorCount = 0;

  let docsToBeSentWithStatus = docsToBeSent.map((doc) => {
    let status = localStorage.getItem(`upload-log-${doc.documentNumber}`);
    if (status === null) {
      status = "pending";
    }
    return {
      ...doc,
      status: status,
    };
  });

  //   move all the pending ones to the top
  docsToBeSentWithStatus.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") {
      return -1;
    }
    if (a.status !== "pending" && b.status === "pending") {
      return 1;
    }

    // Move any errors to the top
    let isAlreadySentA =
      a.status === `Document ${a.documentNumber} is already used`;
    let isAlreadySentB =
      b.status === `Document ${b.documentNumber} is already used`;

    if (isAlreadySentA && !isAlreadySentB) {
      return 1;
    }

    if (!isAlreadySentA && isAlreadySentB) {
      return -1;
    }

    return 0;
  });

  for (let newDoc of docsToBeSentWithStatus) {
    let status = newDoc.status;
    let docRow = document.createElement("div");
    docRow.innerHTML = docRowTemplate;

    docRow.querySelector("#documentNumber").textContent = newDoc.documentNumber;
    docRow.querySelector("#status").textContent = status;

    if (status === "success") {
      totalSent++;

      docRow.querySelector("#status").textContent = "\u2713";
      // make the status green
      docRow.querySelector("#status").style.color = "green";
      docRow.querySelector("#send").style.display = "none";

      docRow.querySelector("#documentNumber").style.color = "#ccc";

      let button = docRow.querySelector("#send");
      button.clickHandler = null;
    } else if (status === `Document ${newDoc.documentNumber} is already used`) {
      // Already sent. Grey it out
      totalSent++;
      docRow.querySelector("#documentNumber").style.color = "#ccc";

      let button = docRow.querySelector("#send");
      button.clickHandler = null;
      button.style.display = "none";

      let status = docRow.querySelector("#status");
      status.style.color = "#ccc";
      status.textContent = "already sent";
    } else {
      docRow.querySelector("#status").style.color = "inherit";

      if (status !== "pending") {
        // Remove the status and add it to the error div
        docRow.querySelector("#error").textContent = status;
        docRow.querySelector(".error-alert-1").style.display = "block";
        docRow.querySelector("#status").style.display = "none";
        errorCount++;
      } else {
        docRow.querySelector("#status").textContent = "";
      }

      let button = docRow.querySelector("#send");

      if (idsSending.includes(newDoc.documentNumber)) {
        button.disabled = true;
        // Show a spinner
        button.innerHTML = `Sending...`;
      }

      button.clickHandler = async function (e) {
        idsSending.push(newDoc.documentNumber);

        button.disabled = true;
        // Show a spinner
        button.innerHTML = `Sending...`;

        try {
          await send(newDoc.documentNumber, newDoc.xml);
        } finally {
          button.disabled = false;
          button.innerHTML = `Send`;

          idsSending = idsSending.filter((id) => id !== newDoc.documentNumber);

          buildDocRows();
        }
      };

      button.addEventListener("click", button.clickHandler);
    }

    docs.appendChild(docRow);
  }

  //   Update the status
  let status = mainPanelDiv.querySelector("#status");
  status.innerHTML = `<p style="margin-bottom:0px;">Sent ${totalSent} of ${
    docsToBeSent.length
  } documents <br\> <span style="color: ${
    errorCount > 0 ? "red" : "inherit"
  };">Errors ${errorCount}</span></p>`;

  if (docsToBeSent.length === totalSent) {
    status.innerHTML = `Sent ${totalSent} documents - all done!`;

    // Change the footer to a button to close the panel
    let footer = mainPanelDiv.querySelector("#footer");
    footer.innerHTML = `<button class="button-3 large" role="button" id="close">Finish</button>`;
    footer.style.display = "block";

    let closeButton = footer.querySelector("#close");
    closeButton.addEventListener("click", function (e) {
      cleanup();
      addForm();
    });
  }
}

function trimAllNodes(document, nodeName) {
  let nodes = Array.from(document.querySelectorAll(nodeName));
  for (let node of nodes) {
    node.textContent = node.textContent.trim();
  }
}

async function autosendNext() {
  let allButtons = mainPanelDiv.querySelectorAll("#send");

  // Get the first button with a click handler
  let button = Array.from(allButtons).find((b) => b.clickHandler !== null);

  if (button === undefined) {
    // all done
  }

  await button.clickHandler();

  await autosendNext();
}

async function sendAllAtOnce() {
  console.log("sending all at once");

  let allButtons = mainPanelDiv.querySelectorAll("#send");

  let buttons = Array.from(allButtons).filter((b) => b.clickHandler !== null);

  let promises = buttons.map((b) => b.clickHandler());

  await Promise.all(promises);
}

async function send(documentNumber, xmlContent) {
  // Check in local storage if we've already uploaded this document
  let uploadStatus = localStorage.getItem(`upload-log-${documentNumber}`);
  if (uploadStatus === "success") {
    console.log(`Already uploaded ${documentNumber}`);
    return;
  }

  let xmlContentBase64 = btoa(xmlContent);
  let result = await fetch(
    "https://nifais.daera-ni.gov.uk/NIFAISPortal/WSProxy.ashx/nifais-irm/rest/ela/upload-market-move-out/",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "content-type": "application/json",
        nifais_businessrole: "ELA-Business",
      },
      method: "POST",
      mode: "cors",
      credentials: "include",
      body: JSON.stringify({
        fileTitle: `mm-upload-${documentNumber}`,
        fileExtension: `xml`,
        fileContent: xmlContentBase64,
      }),
    }
  );

  let status = result.status;

  if (status === 200) {
    // Save in local storage that we've uploaded this document

    let data = await result.json();

    // let data = {
    //     "successList": [],
    //     "errorList": [
    //         {
    //             "documentNumber": "...",
    //             "errorList": [
    //                 " Invalid Animal Numbers: {[  ]}"
    //             ]
    //         }
    //     ]
    // }

    if (data.errorList.length === 0) {
      localStorage.setItem(`upload-log-${documentNumber}`, "success");
      console.log(`Successfully uploaded ${documentNumber} data:`, data);
      return {
        status: "success",
        statusCode: status,
        documentNumber: documentNumber,
      };
    }

    let errors = data.errorList.map((e) => e.errorList.join(", ")).join("\n");
    localStorage.setItem(`upload-log-${documentNumber}`, errors);

    console.error(`Failed to upload ${documentNumber}`, errors);

    return {
      status: "error",
      documentNumber: documentNumber,
      errors,
    };
  }

  let body = "";
  try {
    body = await result.text();
  } catch (e) {
    console.log(e);
  }

  localStorage.setItem(`upload-log-${documentNumber}`, `${status} - ${body}`);

  console.error(`Failed to upload ${documentNumber}  - ${status} - ${body}`);

  return {
    status: "error",
    statusCode: status,
    documentNumber: documentNumber,
    body: body,
  };
}

function cleanup() {
  // Remove the panel and reset
  mainPanelDiv.remove();

  docsToBeSent = [];

  mainPanelDiv = document.createElement("div");
  // Set the innerHTML of the div to our template
  mainPanelDiv.innerHTML = template;

  resetLocalStorage();
}

function resetLocalStorage() {
  // Reset everything in localstorage
  for (let key in localStorage) {
    if (key.startsWith("upload-log-")) {
      localStorage.removeItem(key);
    }
  }
}
