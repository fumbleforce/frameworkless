(function(window, undefined) {
  var currentScript;

  var verbose = window.VERBOSE;

  // Allows multiple imports to wait for same resource
  var onloadTriggers = {};

  // Shortcut to already-loaded components
  var loadedUrls = {};

  // Remove ugly script tag that called loader
  function cleanup () {
    currentScript.parentNode.removeChild(currentScript);
  }

  // Mines the imports for loadable content and appends it to head and body respectively
  function appendContent (container) {
    return function (content) {
      content.querySelectorAll('body > *').forEach(function (node) {
        verbose && console.log("[Import] Appending node", node, "to", container);
        container.appendChild(node.cloneNode(true));
      });
      content.querySelectorAll('head > *').forEach(function (node) {
        verbose && console.log("[Import] Appending node", node, "to", container);
        container.appendChild(node.cloneNode(true));
      });

      cleanup();
    }
  }

  // Add a listener for an import
  function addOnloadListener (url, fn) {
    verbose && console.log("[Import] Adding onload listener for", url);
    if (typeof onloadTriggers[url] === "object") {
      onloadTriggers[url].push(fn);
    } else {
      fn(onloadTriggers[url]);
    }
  }

  // Notify all import listeners that content has been loaded,
  // and set loadedUrl
  function triggerOnloadListeners (url, content) {
    verbose && console.log("[Import] Triggering onload for", url);
    loadedUrls[url] = content;
    onloadTriggers[url].forEach(function (fn) {
      fn(content);
    });
  }

  // Import a html component and place it in a container
  function importComponent (url, containerQuery) {
    verbose && console.log("[Import] Importing component", url, "to", containerQuery);
    currentScript = document.currentScript;
    var container = currentScript.parentNode;

    var existingImport = url in onloadTriggers;

    if (!existingImport) {
      verbose && console.log("[Import] Adding link for", url);
      var link = document.createElement('link');
      link.rel = 'import';
      link.href = url;
      link.onload = function(e) {
        triggerOnloadListeners(url, this.import);
      };
      onloadTriggers[url] = [];
      document.head.appendChild(link);
      addOnloadListener(url, appendContent(container));
    } else if (url in loadedUrls) {
      appendContent(container)(loadedUrls[url]);
    } else {
      addOnloadListener(url, appendContent(container));
    }
  }

  window.importComponent = importComponent;
})(window);
