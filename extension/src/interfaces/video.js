const MediaAPI = require('./api');


const GenericVideo = function (window) {
  const videos = widonw.document.getElementsByTagName('video');

  MediaAPI.call(this);
  this._currentVideo = null;
};

GenericVideo.prototype = Object.create(MediaAPI.prototype);

GenericVideo.prototype.getStatus = function () {
  const track = this._api.getCurrentTrack();
  const isPlaying = this.isPlaying();

  let status;

  if (track) {

  } else {
    status = {
      cover: '',
      title: '',
      isPlaying: isPlaying,
      duration: 0,
      artist: ''
    };
  }

  return status;
};

GenericVideo.prototype.getProgress = function () {
  const progress = this._api.getProgress();

  return {
    position: progress.position,
    loaded: progress.loaded,
    duration: progress.duration
  };
};

GenericVideo.prototype.on = function (eventName, func) {
  switch (eventName) {
    case this.EVENT_STATE:
      this._api.on(this._api.EVENT_STATE, func);
      break;
    case this.EVENT_TRACK:
      this._api.on(this._api.EVENT_TRACK, func);
      break;
    case this.EVENT_PROGRESS:
      this._api.on(this._api.EVENT_PROGRESS, func);
      break;
    case this.EVENT_READY:
      this._api.on(this._api.EVENT_READY, func);
      break;
    default:
      console.err(`${eventName} event is not supported.`);
  }
};

GenericVideo.prototype.isPlaying = function () {
  return this._api.isPlaying();
};

GenericVideo.prototype.play = function () {
  if (!this.isPlaying()) {
    this._api.togglePause();
  }
};

GenericVideo.prototype.pause = function () {
  if (this.isPlaying()) {
    this._api.togglePause();
  }
};

// GenericVideo.prototype.togglePause = function () {
//   this._api.togglePause();
// };

GenericVideo.prototype.prev = function () {
  this._api.prev();
};

GenericVideo.prototype.setPosition = function (pos) {
  this._api.setPosition(pos);
};

GenericVideo.prototype.next = function () {
  this._api.next();
};

module.exports = GenericVideo;
