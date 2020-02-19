const MediaAPI = function () {
  this.EVENT_STATE = 'EVENT_STATE';
  this.EVENT_TRACK = 'EVENT_TRACK';
  this.EVENT_PROGRESS = 'EVENT_PROGRESS';
  this.EVENT_READY = 'EVENT_READY';
};

MediaAPI.prototype.getStatus = function () {
  console.error('Not implemented error.')
};

MediaAPI.prototype.getProgress = function () {
  console.error('Not implemented error.')
};

MediaAPI.prototype.on = function (eventName, func) {
  console.error('Not implemented error.');

  switch (eventName) {
    case this.EVENT_STATE:
      break;
    case this.EVENT_TRACK:
      break;
    case this.EVENT_PROGRESS:
      break;
    case this.EVENT_READY:
      break;
    default:
      console.err(`${eventName} event is not supported.`);
  }
};

MediaAPI.prototype.isPlaying = function () {
  console.error('Not implemented error.')
};

MediaAPI.prototype.play = function () {
  console.error('Not implemented error.')
};

MediaAPI.prototype.pause = function () {
  console.error('Not implemented error.')
};

MediaAPI.prototype.togglePause = function () {
  if (this.isPlaying()) {
    this.pause();
  } else {
    this.play();
  }
};

MediaAPI.prototype.prev = function () {
  console.error('Not implemented error.')
};

MediaAPI.prototype.setPosition = function (pos) {
  console.error('Not implemented error.')
};

MediaAPI.prototype.next = function () {
  console.error('Not implemented error.')
};

module.exports = MediaAPI;
