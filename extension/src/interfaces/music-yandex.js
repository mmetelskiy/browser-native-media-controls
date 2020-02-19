const MediaAPI = require('./api');


const YandexMusicAPI = function (window) {
  if (!window.externalAPI) {
    throw new Error('externalAPI not found in window scope. Check yandex music api for changes.');
  }

  MediaAPI.call(this);
  this._api = window.externalAPI;
};

YandexMusicAPI.prototype = Object.create(MediaAPI.prototype);

YandexMusicAPI.prototype.getStatus = function () {
  const track = this._api.getCurrentTrack();
  const isPlaying = this.isPlaying();

  let status;

  if (track) {
    status = {
      cover: track.cover ? `https://${track.cover.replace('%%', '50x50')}` : '',
      title: track.title,
      isPlaying: isPlaying,
      duration: track.duration,
      artist: [].map.call(track.artists, (artist) => artist.title).join(', ')
    };
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

YandexMusicAPI.prototype.getProgress = function () {
  const progress = this._api.getProgress();

  return {
    position: progress.position,
    loaded: progress.loaded,
    duration: progress.duration
  };
};

YandexMusicAPI.prototype.on = function (eventName, func) {
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

YandexMusicAPI.prototype.isPlaying = function () {
  return this._api.isPlaying();
};

YandexMusicAPI.prototype.play = function () {
  if (!this.isPlaying()) {
    this._api.togglePause();
  }
};

YandexMusicAPI.prototype.pause = function () {
  if (this.isPlaying()) {
    this._api.togglePause();
  }
};

// YandexMusicAPI.prototype.togglePause = function () {
//   this._api.togglePause();
// };

YandexMusicAPI.prototype.prev = function () {
  this._api.prev();
};

YandexMusicAPI.prototype.setPosition = function (pos) {
  this._api.setPosition(pos);
};

YandexMusicAPI.prototype.next = function () {
  this._api.next();
};

module.exports = YandexMusicAPI;
