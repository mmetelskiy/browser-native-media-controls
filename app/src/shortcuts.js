const { globalShortcut } = require('electron');

const accelerators = {
  MEDIA_PLAY_PAUSE: 'MediaPlayPause',
  MEDIA_PLAY_PAUSE_ALTERNATIVE: 'Cmd+Ctrl+P',
  MEDIA_NEXT: 'MediaNextTrack',
  MEDIA_PREV: 'MediaPreviousTrack',
};

const shortcutToEvent = {
  [accelerators.MEDIA_PLAY_PAUSE]: 'playpause',
  [accelerators.MEDIA_PLAY_PAUSE_ALTERNATIVE]: 'playpause',
  [accelerators.MEDIA_NEXT]: 'next',
  [accelerators.MEDIA_PREV]: 'prev',
};

exports.register = function (emitter) {
  Object.entries(shortcutToEvent).forEach(([accelerator, event]) => {
    const registered = globalShortcut.register(accelerator, () => {
      console.log(`Catchet ${event} from shortcut...`);

      emitter(event);
    });

    if (!registered) {
      console.log(`Something went wrong with registering ${accelerator} shortcut...`);
    }
  });
};

exports.unregister = function () {
  globalShortcut.unregisterAll();
};
