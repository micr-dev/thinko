import criticalStopSrc from 'assets/sounds/xp/xp-critical-stop.wav';
import logoffSrc from 'assets/sounds/xp/xp-logoff.wav';
import shutdownSrc from 'assets/sounds/xp/xp-shutdown.wav';
import startupSrc from 'assets/sounds/xp/xp-startup.wav';

const SOUND_SRCS = Object.freeze({
  criticalStop: criticalStopSrc,
  logoff: logoffSrc,
  shutdown: shutdownSrc,
  startup: startupSrc,
});

const audioCache = new Map();
let hasPlayedStartupSound = false;

function getAudio(soundName) {
  if (!audioCache.has(soundName)) {
    const audio = new Audio(SOUND_SRCS[soundName]);
    audio.preload = 'auto';
    audioCache.set(soundName, audio);
  }

  return audioCache.get(soundName);
}

export function playXpSound(soundName) {
  if (!SOUND_SRCS[soundName]) {
    return Promise.resolve(false);
  }

  try {
    const audio = getAudio(soundName);
    audio.currentTime = 0;
    const playResult = audio.play();

    if (playResult && typeof playResult.catch === 'function') {
      return playResult.then(() => true).catch(() => false);
    }

    return Promise.resolve(true);
  } catch (error) {
    return Promise.resolve(false);
  }
}

export function playStartupSoundOnce() {
  if (hasPlayedStartupSound) {
    return Promise.resolve(false);
  }

  hasPlayedStartupSound = true;
  return playXpSound('startup');
}
