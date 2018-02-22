import '../polymer/polymer.js';
import { Polymer } from '../polymer/lib/legacy/polymer-fn.js';
Polymer({
  is: 'app-media-stream',

  properties: {
    /**
     * The audio device to use when creating the media stream.
     *
     * @type {MediaDeviceInfo}
     */
    audioDevice: {
      type: Object,
      value: null
    },

    /**
     * The video device to use when creating the media stream.
     *
     * @type {MediaDeviceInfo}
     */
    videoDevice: {
      type: Object,
      value: null
    },

    /**
     * The audio constraints to use when creating the media stream.
     */
    audioConstraints: {
      type: Object,
      value: null
    },

    /**
     * The video constraints to use when creating the media stream.
     */
    videoConstraints: {
      type: Object,
      value: null
    },

    /**
     * A media stream that is created using the configured audio and/or
     * video device(s).
     *
     * @type {MediaStream}
     */
    stream: {
      type: Object,
      notify: true,
      readOnly: true
    },

    /**
     * If true, a media stream will be created. If false, the media stream
     * will be discarded and the stream property will be unset. Discarding
     * the media stream is akin to turning off access to the camera and/or
     * microphone, and is useful in some UX conditions (e.g., switching
     * tabs).
     */
    active: {
      type: Boolean,
      notify: true,
      value: false
    },

    /**
     * A reference to the constraints that are used when requesting the
     * media stream.
     */
    constraints: {
      type: Object,
      readOnly: true
    }
  },

  observers: [
    '_updateConstraints(audioDevice, videoDevice, audioConstraints, videoConstraints)',
    '_updateStream(constraints, active)'
  ],

  _combineConstraints: function(inputConstraints, inputDevice) {
    if (inputConstraints == null && inputDevice == null) {
      return false;
    }

    var combinedConstraints = this.extend({}, inputConstraints);

    if (inputDevice != null) {
      combinedConstraints.deviceId = {
        exact: inputDevice.deviceId
      };
    }

    return combinedConstraints;
  },

  _updateConstraints: function() {
    this.debounce('_updateConstraints', function() {
      var audioConstraints = this._combineConstraints(
          this.audioConstraints, this.audioDevice);
      var videoConstraints = this._combineConstraints(
          this.videoConstraints, this.videoDevice);

      if (audioConstraints || videoConstraints) {
        this._setConstraints({
          audio: audioConstraints,
          video: videoConstraints
        });
      } else {
        this._setConstraints(null);
      }
    });
  },

  _updateStream: function() {
    if (this.active && this.constraints != null) {
      this.debounce('_updateStream', function() {
        var self = this;

        try {
          if (this.stream != null) {
            this.stream.getTracks().forEach(function(track) {
              track.stop();
            });
          }

          this.__gettingUserMedia = this.__gettingUserMedia ||
              navigator.mediaDevices.getUserMedia(this.constraints)
                  .then(function(stream) {
                    self.__gettingUserMedia = null;
                    self._setStream(self.active ? stream : null);
                  })
                  .catch(function(e) {
                    self.fire('media-stream-error', e);
                    self._error(self._logf('Media stream access rejected.', e));
                  });
        } catch (e) {
          this.fire('media-stream-error', e);
          this._error(this._logf('Failed to access media stream.', e));
        }
      }, 1);
    } else {
      this._setStream(null);
    }
  }
})
