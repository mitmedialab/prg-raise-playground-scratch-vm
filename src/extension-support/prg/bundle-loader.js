import { FrameworkID, AuxiliaryExtensionInfo } from "../../dist/globals";

/**
 * Initialize an extension (if it supports the PRG Framework strategy of initialization)
 * @param {Extension} extension 
 * @returns 
 */
export const tryInitExtension = (extension) =>
  extensionInit in extension
    ? Promise.resolve(extension[extensionInit]())
    : Promise.resolve();

/**
 * Try to retrieve the constructor of an Extension loaded from an external bundle
 * @param {string} id ID of Extension (bundle) to load
 * @returns {Constructor<Extension>}
 */
export const tryGetExtensionConstructorFromBundle = async (id) => {
  if (constructors.has(id)) return constructors.get(id);

  const success = await tryImportExtensionBundle(id,
    {
      onLoad: function () {
        const { Extension, ...aux } = window[id];
        constructors.set(id, class extends Extension {
          constructor(runtime) { super(runtime, ...window[AuxiliaryExtensionInfo][id]) }
        });
        auxiliarObjects.set(id, aux);
      },
      onError: () => console.log(`Unable to load bundle for ${id}`)
    }
  );

  return success ? constructors.get(id) : undefined;
}

/**
 * Try to retrieve external objects loaded with a given Extension bundle
 * @param {*} id 
 * @param {*} name 
 * @returns 
 */
export const tryGetAuxiliaryObjectFromLoadedBundle = (id, name) => {
  if (!auxiliarObjects.has(id)) return notLoadedError();
  const auxiliarContainer = auxiliarObjects.get(id);
  return (name in auxiliarContainer) ? auxiliarContainer[name] : unknownPropertyError();
}

const extensionInit = "internal_init";
const constructors = new Map();
const auxiliarObjects = new Map();

const untilScriptLoaded = (endpoint, { onLoad, onError }) => {
  console.log(endpoint);
  if (endpoint.includes("simpleprg95grpexample")) {
    console.log("HERE", window["simpleprg95grpexample"]);
    console.log(window[AuxiliaryExtensionInfo]["simpleprg95grpexample"])
  }
  var scriptTag = document.createElement('script');
  var host = location.href.split("?")[0];
  host = host.endsWith("/") ? host.slice(0, -1) : host;
  scriptTag.src = `${host}/static/${endpoint}`;
  return new Promise((resolve, reject) => {
    scriptTag.onload = () => resolve(onLoad());
    scriptTag.onerror = () => reject(onError())
    document.body.appendChild(scriptTag);
    setTimeout(() => {
      console.log("HERE 2", window["simpleprg95grpexample"]);
      console.log(window[AuxiliaryExtensionInfo]["simpleprg95grpexample"])
    }, 1000)
    
  });
}

const getEndPoint = (filename) => `extension-bundles/${filename}.js`;

const getCommonObject = (id) => window[id];

const findAuxiliaryJson = (id) => {
  var host = location.href.split("?")[0];
    host = host.endsWith("/") ? host.slice(0, -1) : host;
    const auxiliaryPath = `${host}/static/${getEndPoint(AuxiliaryExtensionInfo)}`;
    fetch(auxiliaryPath)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.text();
    })
    .then(scriptText => {
      const regex = new RegExp(`var\\s+${AuxiliaryExtensionInfo}\\s*=\\s*(\\{[\\s\\S]*?\\});`);
      const match = scriptText.match(regex);

      if (match && match[1]) {
        try {
          const loadedJSON = JSON.parse(match[1]);
          if (loadedJSON[id]) {
            window['AuxiliaryExtensionInfo'][id] = loadedJSON[id];
          }
        } catch (err) {
          console.error('Failed to parse JSON:', err);
        }
      }
      
    })
    .catch(error => {
      console.error(`Failed to fetch JSON for ${id}:`, error);
    });
}

const validateCommonObject = (id) => getCommonObject(id)
  ? console.log(`'${id}' succesfully loaded!`)
  : console.error(`Could not find '${id}' object after loading script`);

const untilCommonObjects = (foundId, IDs) => Promise.all(
  IDs.map(id => {
    if (getCommonObject(id) && id === AuxiliaryExtensionInfo) {
      findAuxiliaryJson(foundId);
      return; // Already loaded
    }
    getCommonObject(id)
    ? Promise.resolve()
    : untilScriptLoaded(getEndPoint(id),
      {
        onLoad: () => validateCommonObject(id),
        onError: () => { throw new Error(`Could not load ${id}`) }
      }
    )
  })
);

const tryImportExtensionBundle = async (id, callbacks) => {
  console.log("IMPORTING");
  console.log(id);
  try {
    await untilCommonObjects(id, [FrameworkID, AuxiliaryExtensionInfo]);
    await untilScriptLoaded(getEndPoint(id), callbacks);
    return true;
  }
  catch (e) {
    console.error(e);
    return false;
  }
}

const notLoadedError = () => console.error("Tried to access auxiliar constructor of an extension bundle that wasn't already loaded.");
const unknownPropertyError = (name, id) => console.error(`The requested object '${name}' was not loaded with extension ${id}`);