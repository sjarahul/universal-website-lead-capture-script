(function () {
  let config = {
    siteKey: null
  };

  // Helper function to extract siteKey from script URL
  function extractSiteKeyFromScript() {
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1].src;
    const urlParams = new URLSearchParams(currentScript.split('?')[1]);
    config.siteKey = urlParams.get('siteKey');
    if (!config.siteKey) {
      console.error("Site key not found in script URL");
    }
  }

  // Utility function to validate email
  function isValidEmail(email) {
    var regex = /^([^@]+?)@(([a-z0-9]-*)*[a-z0-9]+\.)+([a-z0-9]+)$/i;
    return regex.test(email);
  }

  // Collect all the form data excluding file inputs
  function collectFormData(form) {
    var formData = [];
    var containsFile = false;

    var elements = form.elements; // Get all form elements

    for (var i = 0; i < elements.length; i++) {
      var field = elements[i];

      // Detect file inputs and flag them, but don't include them in formData
      if (field.type === "file") {
        containsFile = true;
        continue; // Skip file inputs
      }

      // Collect form fields (input, textarea, select)
      if (field.name && field.type !== "button" && field.type !== "submit") {
        // Validate email fields
        if (field.type === "email" && !isValidEmail(field.value)) {
          throw new Error("Invalid email address");
        }

        // Handle checkboxes and radio buttons
        if (field.type === 'checkbox' || field.type === 'radio') {
          if (field.checked) {
            formData.push({ name: field.name, value: field.value });
          }
        } else if (field.tagName === 'SELECT' && field.multiple) {
          const selectedOptions = Array.from(field.selectedOptions).map(option => option.value);
          formData.push({ name: field.name, value: selectedOptions });
        } else {
          formData.push({ name: field.name, value: field.value });
        }
      }
    }

    return { formData, containsFile };
  }

  // Function to send collected data to the CRM and return a promise
  function sendDataToCRM(data) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      var crmEndpoint = 'https://webhook-test.com/7de36114a693293add6fbc9a1ad6cd13'; // Replace with your CRM endpoint
      xhr.open('POST', crmEndpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Failed to send data to CRM"));
          }
        }
      };

      // Send the form data along with the siteKey
      xhr.send(JSON.stringify({
        siteKey: config.siteKey,  // Include siteKey in the payload
        fields: data              // Send form fields
      }));
    });
  }

  // Function to handle form submission and trigger the CRM data submission
  function handleSubmission(event) {
    event.preventDefault(); // Temporarily prevent default behavior

    var form = event.target;

    try {
      // Capture related form data
      var { formData, containsFile } = collectFormData(form);

      // Send data to CRM excluding file fields
      sendDataToCRM(formData).then(function () {
        // After the data is sent, manually trigger the default action
        form.submit();

        // If the form contained a file, show an alert
        if (containsFile && document.readyState === 'complete') {
          alert("Form data was successfully sent, but files were excluded because the CRM does not support file uploads.");
        }
      }).catch(function (error) {
        console.error(error);
        form.submit(); // Submit form anyway if sending to CRM fails
      });
    } catch (error) {
      console.error("Validation error:", error.message);
      // Handle validation errors (e.g., invalid email), but do not prevent submission
    }
  }

  // Function to add event listeners to forms
  function attachListeners() {
    var forms = document.querySelectorAll('form');
    forms.forEach(function (form) {
      form.addEventListener('submit', handleSubmission, true); // Capture phase
    });
  }

  // Observe DOM changes in case forms are dynamically added
  function observeDOMChanges() {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        attachListeners(); // Attach listeners to any newly added forms
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize listeners on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    extractSiteKeyFromScript(); // Extract siteKey from script URL
    attachListeners(); // Attach listeners to forms
    observeDOMChanges(); // Observe DOM for dynamically added forms
  });
})();
