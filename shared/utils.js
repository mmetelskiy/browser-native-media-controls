const stringify = function (obj) {
  const found = [];

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (found.includes(value)) {
        return `[duplicate ${key}]`;
      }

      found.push(value);
    }

    return value;
  });
};

const readableArgument = function (argument) {
  if (typeof argument === 'function') {
    return `function ${argument.name || ''}()`;
  } else if (Array.isArray(argument)) {
    return argument.map(readableArgument);
  } else if (typeof argument === 'object') {
    return stringify(argument);
  } else {
    return argument;
  }
};

const argumentsToString = function (args) {
  return [].map.call(args, readableArgument);
};

const log = function (name, event, args, filterNames=undefined, emit=false, once=false) {
  if (filterNames && !filterNames.includes(event)) {
    return
  }

  const action = emit ? 'emitting' : 'occured';
  const argsStr = argumentsToString(args);

  console.log(`${name}: ${event} ${action} ${once ? '(once) ' : ''}with args: [${argsStr}]...`);
};

const exportIfNeeded = function (f) {
  if (typeof window !== 'undefined' && window.wrappedJSObject) {
    f = exportFunction(f, window);
  }

  return f;
};

const patchForEventsDebugging = function (obj, name, filterNames) {
  let methodName;

  if (obj.on) {
    methodName = 'on';
  } else if (obj.addEventListener) {
    methodName = 'addEventListener';
  } else {
    return;
  }

  const unpatchedMethod = obj[methodName];

  obj[methodName] = function (event, callback) {
    let patchedCallback = function () {
      log(name, event, arguments, filterNames)

      return callback.apply(obj, arguments);
    };

    patchedCallback = exportIfNeeded(patchedCallback);

    return unpatchedMethod.call(obj, event, patchedCallback);
  };

  if (obj.once) {
    const unpatchedOnce = obj.once;

    obj.once = function (event, callback) {
      let patchedCallback = function () {
        log(name, event, arguments, filterNames, false, true);

        return callback.apply(obj, arguments);
      };

      patchedCallback = exportIfNeeded(patchedCallback);

      return unpatchedOnce.call(obj, event, patchedCallback);
    };
  }

  if (obj.emit) {
    const emit = obj.emit;

    obj.emit = function () {
      const event = arguments[0];
      const argsList = [].slice.call(arguments, 1);

      log(name, event, argsList, filterNames, true);

      return emit.apply(obj, arguments);
    };
  }
};

exports.patchForEventsDebugging = patchForEventsDebugging;
