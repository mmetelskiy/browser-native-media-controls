const MusicYandex = require('./music-yandex');
const MusicApple = require('./music-apple');
const GenericVideo = require('./video');

const getCurrentInterface = function () {
  let w = window;
  let currentInterface;

  if (w.wrappedJSObject) {
    // firefox xray view
    w = w.wrappedJSObject;
  }

  if (w.MusicKit) {
    // apple
    currentInterface = new MusicApple(w);
  } else if (w.externalAPI) {
    // yandex
    currentInterface = new MusicYandex(w);
  } else if (document.getElementsByTagName('video').length) {
    currentInterface = new GenericVideo(w);
  } else {
    console.error('Could not find appropriate interface.');
  }

  return currentInterface;
};

exports.getCurrentInterface = getCurrentInterface;
