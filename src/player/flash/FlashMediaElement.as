package  
{
	import flash.display.*;
	import flash.events.*;
	import flash.media.*;
	import flash.net.*;
	import flash.text.*;
	import flash.system.*;

	import flash.media.Video;
	import flash.net.NetConnection;
	import flash.net.NetStream;
	
	import flash.geom.ColorTransform;

	import flash.filters.DropShadowFilter;
	import flash.utils.Timer;
	import flash.external.ExternalInterface;
	import flash.geom.Rectangle;

	import elements.IMediaElement;
	import elements.VideoElement;
	import elements.AudioElement;
	import elements.YouTubeElement;
	
	public class FlashMediaElement extends Sprite {
		private var _mediaUrl:String;
		private var _autoplay:Boolean;
		private var _preload:String;
		private var _debug:Boolean;
		private var _video:DisplayObject;
		private var _timerRate:Number;
		private var _enableSmoothing:Boolean;
		private var _allowedPluginDomain:String;
		private var _isFullScreen:Boolean = false;
		private var _startVolume:Number = 1;
		private var _startMuted:Boolean = false;
		//private var _rewind:Boolean = true;
		private var _streamer:String = "";
		private var _isVideo:Boolean = true;
		private var _isAudio:Boolean = false;

		// native video size (from meta data)
		private var _nativeVideoWidth:Number = 0;
		private var _nativeVideoHeight:Number = 0;

		// visual elements
		private var _output:TextField;

		// media
		private var _mediaElement:IMediaElement;
		private var _youtubeElement:YouTubeElement;
		private var _audioElement:AudioElement;
		private var _videoElement:VideoElement;

		public function FlashMediaElement() {
			// show allow this player to be called from a different domain than the HTML page hosting the player
			Security.allowDomain("*");

			// get parameters
			var params:Object = LoaderInfo(this.root.loaderInfo).parameters;
			_mediaUrl = (params['mediaUrl'] != undefined) ? String(params['mediaUrl']) : "";
			_autoplay = (params['autoPlay'] != undefined) ? (String(params['autoPlay']) == "true") : false;
			_debug = (params['debug'] != undefined) ? (String(params['debug']) == "true") : false;
			_timerRate = (params['timerRate'] != undefined) ? (parseInt(params['timerRate'], 10)) : 250;
			_enableSmoothing = (params['smoothing'] != undefined) ? (String(params['smoothing']) == "true") : true;
			_startVolume = (params['startVolume'] != undefined) ? (parseFloat(params['startVolume'])) : 0.8;
			_startMuted = (params['startMuted'] != undefined) ? (String(params['startMuted']) == "true") : false;
			_preload = (params['preload'] != undefined) ? params['preload'] : "none";
			//_rewind = (params['rewind'] != undefined) ? params['rewind'] : false;
			
			_streamer = (params['flashstreamer'] != undefined) ? (String(params['flashstreamer'])) : "";
			
			if (isNaN(_timerRate))
				_timerRate = 250;

			// setup stage and player sizes/scales
			stage.align = StageAlign.TOP_LEFT;
			stage.scaleMode = StageScaleMode.NO_SCALE;
			
			// debugging
			_output = new TextField();
			_output.textColor = 0xeeeeee;
			_output.width = stage.stageWidth - 100;
			_output.height = stage.stageHeight;
			_output.multiline = true;
			_output.wordWrap = true;
			_output.border = false;
			_output.filters = [new DropShadowFilter(1, 0x000000, 45, 1, 2, 2, 1)];

			addChild(_output);
			_output.visible = _debug;
			_output.text = "Initializing...\n";
			_output.appendText("stage: " + stage.stageWidth + "x" + stage.stageHeight + "\n");
			_output.appendText("autoplay: " + _autoplay.toString() + "\n");
			_output.appendText("preload: " + _preload.toString() + "\n");
			_output.appendText("smoothing: " + _enableSmoothing.toString() + "\n");
			_output.appendText("timerrate: " + _timerRate.toString() + "\n");
			_output.appendText("displayState: " +(stage.hasOwnProperty("displayState")).toString() + "\n");

			// attach javascript
			_output.appendText("ExternalInterface.available: " + ExternalInterface.available.toString() + "\n");
			_output.appendText("ExternalInterface.objectID: " + ((ExternalInterface.objectID != null)? ExternalInterface.objectID.toString() : "null") + "\n");

			if (_mediaUrl != "") {
				_mediaElement.setSource(_mediaUrl);
				if (_autoplay) {
					playMedia();
				}
			}

			if (ExternalInterface.available) { //  && !_alwaysShowControls
				try {
					if (ExternalInterface.objectID != null && ExternalInterface.objectID.toString() != "") {
						_output.appendText("Adding callbacks...\n");
						// add HTML media methods
						ExternalInterface.addCallback("playMedia", playMedia);
						ExternalInterface.addCallback("loadMedia", loadMedia);
						ExternalInterface.addCallback("pauseMedia", pauseMedia);
						ExternalInterface.addCallback("muteMedia", muteMedia);
						ExternalInterface.addCallback("stopMedia", stopMedia);
	
						ExternalInterface.addCallback("setSource", setSource);
						ExternalInterface.addCallback("getDuration", getDuration);
						ExternalInterface.addCallback("getCurrentTime", getCurrentTime);
						ExternalInterface.addCallback("setCurrentTime", setCurrentTime);
						ExternalInterface.addCallback("getVolume", getVolume);
						ExternalInterface.addCallback("setVolume", setVolume);
						ExternalInterface.addCallback("getIsMuted", getIsMuted);
						ExternalInterface.addCallback("setIsMuted", setIsMuted);
						ExternalInterface.addCallback("getIsPaused", getIsPaused);
						//ExternalInterface.addCallback("setIsPaused", setIsPaused);
						ExternalInterface.addCallback("getIsEnded", getIsEnded);
	
						ExternalInterface.addCallback("setFullscreen", setFullscreen);
						//ExternalInterface.addCallback("setVideoSize", setVideoSize);
	
						// fire init method					
						ExternalInterface.call("crown.fetch('crown.player.FlashEssence').flashLoaded", ExternalInterface.objectID);
					}

					_output.appendText("Success...\n");
				} catch (error:SecurityError) {
					_output.appendText("A SecurityError occurred: " + error.message + "\n");
				} catch (error:Error) {
					_output.appendText("An Error occurred: " + error.message + "\n");
				}
			}

			if (_preload != "none") {
				_mediaElement.load();
				if (_autoplay) {
					_mediaElement.play();
				}
			} else if (_autoplay) {
				_mediaElement.load();
				_mediaElement.play();
			}
			// listen for resize
			stage.addEventListener(Event.RESIZE, resizeHandler);
			
			// resize
			stage.addEventListener(FullScreenEvent.FULL_SCREEN, stageFullScreenChanged);
		}
		private function getExtension(file) {
            return file.substring(file.lastIndexOf(".") + 1);
        }
		private function formatType (url, type) {
            var ext;

            // if no type is supplied, fake it with the extension
            if (url && !type) {
                return this.getTypeFromFile(url);
            } else {
                // only return the mime part of the type in case the attribute contains the codec
                // see http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html#the-source-element
                // `video/mp4; codecs="avc1.42E01E, mp4a.40.2"` becomes `video/mp4`
                if (type && ~type.indexOf(';')) {
                    return type.substr(0, type.indexOf(';'));
                } else {
                    return type;
                }
            }
        }
		private function getTypeFromFile(url:String) {
            url = url.split('?')[0];
            var ext = url.substring(url.lastIndexOf('.') + 1);
            return (/(mp4|m4v|ogg|ogv|webm|webmv|flv|wmv|mpeg|mov)/gi.test(ext) ? 'video' : 'audio') + '/' + this.getTypeFromExtension(ext);
		}
		private function getTypeFromExtension(ext) {
            switch (ext) {
                case 'mp4':
                case 'm4v':
                    return 'mp4';
                case 'webm':
                case 'webma':
                case 'webmv':
                    return 'webm';
                case 'ogg':
                case 'oga':
                case 'ogv':
                    return 'ogg';
                default:
                    return ext;
            }
        }
		private function getIsVideo() {
			return 
		}

		function resizeHandler(e:Event):void {
			repositionVideo();
		}

		// START: Fullscreen		
		function enterFullscreen() {
			sendLog("enterFullscreen()"); 
			
			var screenRectangle:Rectangle = new Rectangle(0, 0, flash.system.Capabilities.screenResolutionX, flash.system.Capabilities.screenResolutionY); 
			stage.fullScreenSourceRect = screenRectangle;
			stage.displayState = StageDisplayState.FULL_SCREEN;
			
			repositionVideo(true);
			_isFullScreen = true;
		}
		
		function exitFullscreen() {
			stage.displayState = StageDisplayState.NORMAL;
			_isFullScreen = false;	
		}

		function setFullscreen(gofullscreen:Boolean) {
			sendLog("setFullscreen: " + gofullscreen.toString()); 
			try {
				//_fullscreenButton.visible = false;
				if (gofullscreen) {
					enterFullscreen();

				} else {
					exitFullscreen();
				}
			} catch (error:Error) {
				_isFullScreen = false;
				sendLog("error setting fullscreen: " + error.message.toString() + "\n");   
			}
		}

		function stageFullScreenChanged(e:FullScreenEvent) {
			sendLog("fullscreen event: " + e.fullScreen.toString());   
			_isFullScreen = e.fullScreen;
			sendEvent(HtmlMediaEvent.FULLSCREENCHANGE, "isFullScreen:" + e.fullScreen );
		}
		// END: Fullscreen

		// START: external interface 
		function playMedia() {
			sendLog("play");
			_mediaElement.play();
		}

		function loadMedia() {
			sendLog("load");
			_mediaElement.load();
		}

		function pauseMedia() {
			sendLog("pause");
			_mediaElement.pause();
		}
		function muteMedia() {
			sendLog("mute");
			_mediaElement.setIsMuted(true);
		}

		function setSource(url:String) {
			sendLog("setSrc: " + url);
			var type:String = getTypeFromFile(url);
			if (type.indexOf('audio') >= 0) {
				this._isAudio = true;
				this._isVideo = false;
			} else {
				this._isAudio = false;
				this._isVideo = true;
			}
			
			var currentVolume = _mediaElement == null ? _startVolume : _mediaElement.getVolume();
			if (_isVideo) {
				if (_mediaUrl.indexOf("youtube.com") > -1 || _mediaUrl.indexOf("youtu.be") > -1) {
					//Security.allowDomain("http://www.youtube.com");
					if (_youtubeElement == null) {
						_youtubeElement = new YouTubeElement(this, _autoplay, _preload, _timerRate, currentVolume, _startMuted);
					}
					if (_mediaElement != _youtubeElement) {
						if (_video != null && contains(_video)){
							removeChild(_video);
						}
						_mediaElement = _youtubeElement;
					}
					_video = (_mediaElement as YouTubeElement).player;
					// these are set and then used once the player is loaded
					_youtubeElement.initWidth = stage.stageWidth;
					_youtubeElement.initHeight = stage.stageHeight;
					addChildAt(_video, 0);
				
				} else {
					if (_videoElement == null) {
						_videoElement = new VideoElement(this, _autoplay, _preload, _timerRate, currentVolume, _startMuted, _streamer);
					}
					if (_mediaElement != _videoElement) {
						if (_video != null && contains(_video)){
							removeChild(_video);
						}
						_mediaElement = _videoElement;
					}
					_video = _videoElement.video;
					_video.width = stage.stageWidth;
					_video.height = stage.stageHeight;
					(_video as Video).smoothing = _enableSmoothing;
					_videoElement.setReference(this);
					//_video.scaleMode = VideoScaleMode.MAINTAIN_ASPECT_RATIO;
					addChildAt(_video, 0);
				}
			} else {
				if (_audioElement == null) {
					_audioElement = new AudioElement(this, _autoplay, _preload, _timerRate, currentVolume, _startMuted);
				}
				_mediaElement = _audioElement;
			}

			_mediaElement.setSource(url);
		}

		function stopMedia() {
			sendLog("stop");
			_mediaElement.stop();
		}

		function getDuration():Number{
			return _mediaElement.getDuration();
		}
		function getCurrentTime():Number {
			return _mediaElement.getCurrentTime();
		}
		function setCurrentTime(time:Number) {
			sendLog("seek: " + time.toString());
			_mediaElement.setCurrentTime(time);
		}

		function getVolume():Number {
			if (_mediaElement != null){
				return _mediaElement.getVolume(); 
			}
			else {
				return _startVolume;
			}
		}
		function setVolume(volume:Number) {
			sendLog("volume: " + volume.toString());
			if (volume != getVolume()){
				_mediaElement.setVolume(volume);
			}
		}

		function getIsMuted():Boolean {
			if (_mediaElement != null){
				return _mediaElement.getIsMuted();
			}else {
				return _startMuted;
			}
		}
		function setIsMuted(muted:Boolean) {
			_mediaElement.setIsMuted(muted);
		}
		
		function getIsPaused():Boolean {
			if (_mediaElement != null){
				return _mediaElement.getIsPaused();
			}else {
				return true;
			}
		}
		function setIsPaused(paused:Boolean) {
			sendLog("paused: " + paused.toString());
			_mediaElement.setIsPaused(paused);
		}
		function getIsEnded():Boolean {
			return _mediaElement.getIsEnded();
		}

//		function setVideoSize(width:Number, height:Number) {
//			sendLog("setVideoSize: " + width.toString() + "," + height.toString());
//			stage.stageWidth = width;
//			stage.stageHeight = height;
//
//			if (_video != null) {
//				repositionVideo();
//				//_fullscreenButton.x = stage.stageWidth - _fullscreenButton.width - 10;
//				sendLog("result: " + _video.width.toString() + "," + _video.height.toString());
//			}
//		}
		
		// END: external interface
		function repositionVideo(fullscreen:Boolean = false):void {
			sendLog("positioning video, stage dimension:", stage.stageWidth, 'x', stage.stageHeight);
			var screenResolutionX = flash.system.Capabilities.screenResolutionX;
			var screenResolutionY = flash.system.Capabilities.screenResolutionY;
			if (_mediaElement is VideoElement) {
				if (isNaN(_nativeVideoWidth) || isNaN(_nativeVideoHeight) || _nativeVideoWidth <= 0 || _nativeVideoHeight <= 0) {
					//sendLog("ERR: I dont' have the native dimension");
					return;
				}
	
				// calculate ratios
				var stageRatio, nativeRatio;
				_video.x = 0;
				_video.y = 0;			
				
				if(fullscreen == true) {
					stageRatio = screenResolutionX/screenResolutionY;
					nativeRatio = _nativeVideoWidth/_nativeVideoHeight;
			
					// layout size and position
					if (nativeRatio > stageRatio) {
						_mediaElement.setSize(screenResolutionX, _nativeVideoHeight * screenResolutionX / _nativeVideoWidth);
						_video.y = screenResolutionY/2 - _video.height/2;
					} else if (stageRatio > nativeRatio) {
						_mediaElement.setSize(_nativeVideoWidth * screenResolutionY / _nativeVideoHeight, screenResolutionY);					
						_video.x = screenResolutionX/2 - _video.width/2;
					} else if (stageRatio == nativeRatio) {
						_mediaElement.setSize(screenResolutionX, screenResolutionY);
					}
				} else {
					stageRatio = stage.stageWidth/stage.stageHeight;
					nativeRatio = _nativeVideoWidth/_nativeVideoHeight;
				
					// layout size and position
					if (nativeRatio > stageRatio) {
						_mediaElement.setSize(stage.stageWidth, _nativeVideoHeight * stage.stageWidth / _nativeVideoWidth);					
						_video.y = stage.stageHeight/2 - _video.height/2;
					} else if (stageRatio > nativeRatio) {
						_mediaElement.setSize( _nativeVideoWidth * stage.stageHeight / _nativeVideoHeight, stage.stageHeight);
						_video.x = stage.stageWidth/2 - _video.width/2;
					} else if (stageRatio == nativeRatio) {
						_mediaElement.setSize(stage.stageWidth, stage.stageHeight);
					}
				}
				
			} else if (_mediaElement is YouTubeElement) {
				if(fullscreen) {
					_mediaElement.setSize(screenResolutionX, screenResolutionY);
				} else {
					_mediaElement.setSize(stage.stageWidth, stage.stageHeight);
				}
			}
		}
		
		public function sendLog(...args):void{
			if (_debug){
				ExternalInterface.call('console.log', '[Flash] ' + args.concat());
			}
		}

		// SEND events to JavaScript
		public function sendEvent(eventName:String, eventValues:String) {
			// special video event
			if (eventName == HtmlMediaEvent.LOADEDMETADATA && _isVideo) {
				var log:String = "METADATA RECEIVED: ";
				try {
					if (_mediaElement is VideoElement) {
						_nativeVideoWidth = (_mediaElement as VideoElement).videoWidth;
						_nativeVideoHeight = (_mediaElement as VideoElement).videoHeight;
					}
				} catch (e:Error) {
					log += e.toString();
				}
				sendLog(log + _nativeVideoWidth.toString() + "x" + _nativeVideoHeight.toString());

				 if(stage.displayState == "fullScreen" ) {
					repositionVideo(true);
				 } else {
					repositionVideo();
				 }
			}
			if (ExternalInterface.objectID != null && ExternalInterface.objectID.toString() != "") {
				//_output.appendText("event:" + eventName + " : " + eventValues);
				//sendLog("event:" + eventName + " : " + eventValues);
				//trace("event", eventName, eventValues);
				if (eventValues == null){
					eventValues == "";
				}

				if (_isVideo) {
					eventValues += (eventValues != "" ? "," : "") + "isFullScreen:" + _isFullScreen;
				}
				eventValues = "{" + eventValues + "}";
				// use set timeout for performance reasons
				//if (!_alwaysShowControls) {
					ExternalInterface.call("setTimeout", "crown.fetch('crown.player.FlashEssence').fireMediaEvent('" + ExternalInterface.objectID + "','" + eventName + "'," + eventValues + ")",0);
				//}
			}
		}
		// START: utility
		function secondsToTimeCode(seconds:Number):String {
			var timeCode:String = "";
			seconds = Math.round(seconds);
			var minutes:Number = Math.floor(seconds / 60);
			timeCode = (minutes >= 10) ? minutes.toString() : "0" + minutes.toString();
			seconds = Math.floor(seconds % 60);
			timeCode += ":" + ((seconds >= 10) ? seconds.toString() : "0" + seconds.toString());
			return timeCode; //minutes.toString() + ":" + seconds.toString();
		}
		
		function applyColor(item:Object, color:String):void {
			var myColor:ColorTransform = item.transform.colorTransform;
			myColor.color = Number(color);
			item.transform.colorTransform = myColor;
		}
		// END: utility
	}
}
