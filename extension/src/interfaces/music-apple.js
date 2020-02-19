const MediaAPI = require('./api');


const MusicKitApi = function (window) {
  if (!window.MusicKit) {
    throw new Error('MusicKit not found in window scope. Check yandex music api for changes.');
  }

  MediaAPI.call(this);
  this._api = window.MusicKit;
};

MusicKitApi.prototype = Object.create(MediaAPI.prototype);

MusicKitApi.prototype.getPlayer = function () {
  return this._api.getInstance().player;
};

MusicKitApi.prototype.getStatus = function () {
  const player = this.getPlayer();
  const playingItem = player.nowPlayingItem;

  if (!playingItem) {
    return {
      cover: '',
      title: '',
      isPlaying: player.isPlaying,
      duration: 0,
      artist: ''
    };
  }

  return {
    title: playingItem.attributes.name,
    artist: playingItem.attributes.artistName,
    duration: playingItem.attributes.durationMillis / 1000,
    cover: playingItem.attributes.artwork.url,
    isPlaying: player.isPlaying
  };
};

MusicKitApi.prototype.getProgress = function () {
  const player = this.getPlayer();

  return {
    position: player.currentPlaybackTime || 0,
    loaded: player.currentPlaybackDuration ? player.currentPlaybackDuration * player.currentBufferedProgress / 100 : 0,
    duration: player.currentPlaybackDuration || 0
  };
};

MusicKitApi.prototype.on = function (eventName, func) {
  switch (eventName) {
    case this.EVENT_STATE:
      this.getPlayer().addEventListener(this._api.Events.playbackStateDidChange, func);
      break;
    case this.EVENT_TRACK:
      this.getPlayer().addEventListener(this._api.Events.mediaItemDidChange, func);
      break;
    case this.EVENT_PROGRESS:
      this.getPlayer().addEventListener(this._api.Events.playbackProgressDidChange, func);
      break;
    case this.EVENT_READY:
      this.getPlayer().addEventListener(this._api.Events.loaded, func);
      break;
    default:
      console.err(`${eventName} event is not supported.`);
  }
};

MusicKitApi.prototype.isPlaying = function () {
  return this._api.getInstance().player.isPlaying;
};

MusicKitApi.prototype.play = function () {
  this.getPlayer().play();
};

MusicKitApi.prototype.pause = function () {
  this.getPlayer().pause();
};

MusicKitApi.prototype.prev = function () {
  this.getPlayer().skipToPreviousItem();
};

MusicKitApi.prototype.setPosition = function (pos) {
  this.getPlayer().seekToTime(pos);
};

MusicKitApi.prototype.next = function () {
  this.getPlayer().skipToNextItem();
};

module.exports = MusicKitApi;
