(function(window, undefined) {
  var currentScript;

  var layoutURL = document.currentScript.getAttribute("data-layout");

  // Don't necessarily want to wake the whole neighbourhood
  var verbose = true || window.VERBOSE;

  // Allows multiple imports to wait for same resource
  var componentLoadSubscribers = {};

  // Cache for already-loaded components
  var componentCache = {};

  // Remove ugly script tag that called loader to be all ninja-like
  function removeImportScript () {
    currentScript.parentNode.removeChild(currentScript);
  }

  // Mines the imports for loadable content and appends it to head and body respectively
  function appendContent (container) {
    return function (component) {
      const template = component.querySelector("template");
      verbose && console.log("[Import] Appending node", template, "to", container);
      var content = document.importNode(template.content, true);
      container.appendChild(content.cloneNode(true));

      // removeImportScript();
    }
  }

  // Mines the imports for loadable content and appends it to head and body respectively
  function appendContentTo (content, query) {
    return function (component) {
      var container = document.querySelector(query);
      verbose && console.log("[Import] Appending node", content, "to", container, "in", component);
      container.appendChild(content);
    }
  }

  // Add a listener for an import
  function addComponentLoadSubscriber (url, fn) {
    verbose && console.log("[Import] Adding onload listener for", url);

    var loadedContent = componentCache[url];

    if (loadedContent) {
      verbose && console.log("[Import]", url, "was already loaded, calling subscriber immediately");
      return fn(loadedContent);
    }

    if (!componentLoadSubscribers[url]) {
      componentLoadSubscribers[url] = [];
    }

    componentLoadSubscribers[url].push(fn);
  }

  // Notify all import listeners that content has been loaded,
  // and set loadedUrl
  function notifyLoadSubscribersContentLoaded (url, content) {
    verbose && console.log("[Import] Triggering onload for", url);

    componentCache[url] = content;

    componentLoadSubscribers[url].forEach(function (fn) {
      fn(content);
    });
  }

  // Import a html component and place it in a container
  function importComponent (url, optionalContainer) {
    // This will point to the script that called the import
    currentScript = document.currentScript;

    // We will use the importing script's parent as the container for loaded content
    var container = optionalContainer || currentScript.parentNode;

    verbose && console.log("[Import] Importing component", url, "to", container);

    // Sometimes we load the same component multiple times
    var existingImport = url in componentLoadSubscribers;

    if (!existingImport) {
      verbose && console.log("[Import] Adding link for", url);

      // Make the browser load the component for us
      var link = document.createElement('link');
      link.rel = 'import';
      link.href = url;

      link.onload = function(e) {
        var loadedContent = this.import;
        notifyLoadSubscribersContentLoaded(url, loadedContent);
      };

      document.head.appendChild(link);

      addComponentLoadSubscriber(url, appendContent(container));
    } else if (url in componentCache) {
      appendContent(container)(componentCache[url]);
    } else {
      addComponentLoadSubscriber(url, appendContent(container));
    }
  }

  function setupLayout (url) {
    verbose && console.log("[Import] Setting up layout", url);

    // This is the page's main content
    var pageTemplate = document.querySelector("template");
    var pageContent = document.importNode(pageTemplate.content, true);

    // Load the layout into body
    importComponent(url, document.querySelector("body"));

    // Add in the page content to layout's main element
    addComponentLoadSubscriber(url, appendContentTo(pageContent, "#main"));
  }

  if (layoutURL) {
    setupLayout(layoutURL)
  }

  window.importComponent = importComponent;
})(window);
