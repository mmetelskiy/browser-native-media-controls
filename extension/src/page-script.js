const io = require('socket.io-client');
const _ = require('lodash');

const events = require('./events');
const getCurrentInterface = require('./interfaces').getCurrentInterface;
const utils = require('../../shared/utils');

const DEBUG = false;

const socket = io('http://localhost:3007', { // eslint-disable-line
  transports: ['polling'],
  timeout: 5000
});

if (DEBUG) {
  console.log('Initializing native controls extension.');

  utils.patchForEventsDebugging(socket, 'socket', ['connect', 'status', 'seeked']);
  utils.patchForEventsDebugging(window, 'window', []);
}

const eventDispatcher = function (eventName, noDetail=false) {
  return function (detail) {
    let event;

    if (!noDetail && detail) {
      event = new CustomEvent(eventName, {
        detail
      });
    } else {
      event = new CustomEvent(eventName);
    }

    window.dispatchEvent(event);
  };
};

const subscribeForPlayerEvents = function () {
  const api = getCurrentInterface();

  if (DEBUG) {
    utils.patchForEventsDebugging(api, 'api', [api.EVENT_READY, api.EVENT_STATE, api.EVENT_TRACK]);
  }

  const seekedDispatcher = eventDispatcher(events.SEEKED);
  const statusDispatcher = eventDispatcher(events.STATUS);

  let sendProgress = function () {
    const progress = api.getProgress();

    seekedDispatcher({
      position: progress.position,
      loaded: progress.loaded,
      duration: progress.duration
    });
  };

  sendProgress = _.throttle(sendProgress, 1000, {
    leading: false,
    trailing: true
  });

  let sendPlayerStatus = function () {
    const status = api.getStatus();

    statusDispatcher(status);
  };

  sendPlayerStatus = _.throttle(sendPlayerStatus, 100, {
    leading: false,
    trailing: true
  });

  let trackChanged = sendPlayerStatus;

  let sendFullStatus = function () {
    sendPlayerStatus();
    sendProgress();
  };

  window.addEventListener(events.GET_STATUS, sendFullStatus);

  if (window.wrappedJSObject) {
    // need to export functions to prevent firefox from cleaning foreign functions
    sendProgress = exportFunction(sendProgress, window);
    sendPlayerStatus = exportFunction(sendPlayerStatus, window);
    trackChanged = exportFunction(trackChanged, window);
    sendFullStatus = exportFunction(sendFullStatus, window);
  }

  api.on(api.EVENT_READY, sendFullStatus)
  api.on(api.EVENT_STATE, sendPlayerStatus);
  api.on(api.EVENT_TRACK, trackChanged);
  api.on(api.EVENT_PROGRESS, sendProgress);

  window.addEventListener(events.PLAY, () => {
    api.play();
  });
  window.addEventListener(events.PAUSE, () => {
    api.pause();
  });
  window.addEventListener(events.PLAY_PAUSE, () => {
    api.togglePause();
  })
  window.addEventListener(events.PREV, () => {
    api.prev();
  });
  window.addEventListener(events.TO_BEGINNING, () => {
    api.setPosition(0);
  });
  window.addEventListener(events.NEXT, () => {
    api.next();
  });
};

socket
  .once('connect', subscribeForPlayerEvents)
  .on('connect',        eventDispatcher(events.GET_STATUS, true))
  .on('getStatus',        eventDispatcher(events.GET_STATUS, true))
  .on('play',           eventDispatcher(events.PLAY, true))
  .on('pause',          eventDispatcher(events.PAUSE, true))
  .on('playpause',      eventDispatcher(events.PLAY_PAUSE, true))
  .on('prev',           eventDispatcher(events.PREV, true))
  .on('to-beginning',   eventDispatcher(events.TO_BEGINNING, true))
  .on('next',           eventDispatcher(events.NEXT, true))

window.addEventListener(events.STATUS, (event) => {
  socket.emit('status', event.detail);
});

window.addEventListener(events.SEEKED, (event) => {
  socket.emit('seeked', event.detail);
});
