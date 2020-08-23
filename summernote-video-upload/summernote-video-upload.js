/**
 *
 * copyright 2020 fakefurcoronet
 * url: https://github.com/fakefurcoronet/summernote-video-upload
 * license: MIT
 *
 */
(function (factory) {
  /* Global define */
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    factory(window.jQuery);
  }
}(function ($) {
  /**
   * @class plugin.videoUpload
   *
   * video upload plugin
   */
  $.extend(true, $.summernote.lang, {
    'en-US': {
      videoUpload: {
        video: 'Video',
        videoLink: 'Video Link',
        insert: 'Insert Video',
        providers: '(YouTube, Vimeo, Vine, Instagram, DailyMotion or Youku)',
        selectFromFiles: 'Select from files',
        maximumFileSize: 'Maximum file size',
        maximumFileSizeError: 'Maximum file size exceeded.',
        url: 'Video URL',
        remove: 'Remove Video',
        original: 'Original'
      }
    },
    'ja-JP': {
      videoUpload: {
        video: '動画',
        videoLink: '動画リンク',
        insert: '動画挿入',
        providers: '(YouTube, Vimeo, Vine, Instagram, DailyMotion, Youku)',
        selectFromFiles: '動画ファイルを選ぶ',
        maximumFileSize: '最大ファイルサイズ',
        maximumFileSizeError: '最大ファイルサイズを超えました。',
        url: '動画のURL',
        remove: '動画を削除する',
        original: 'Original'
      }
    }
  });

  $.extend($.summernote.options, {
    videoUpload: {
      icon: '<i class="note-icon-video"></i>'
    },
    maximumVideoFileSize: 4294967296,
    callbacks: {
      onVideoLinkInsert: null,
      onVideoUpload: null,
      onVideoUploadError: null
    }
  });

  $.extend($.summernote.plugins, {
    /**
     *  @param {Object} context - context object has status of editor.
     */
    'videoUpload': function (context) {
      var self = this,

        // ui has renders to build ui elements
        // for e.g. you can create a button with 'ui.button'
        ui = $.summernote.ui,
        $note = context.layoutInfo.note,

        // contentEditable element
        $editor = context.layoutInfo.editor,
        $editable = context.layoutInfo.editable,
        $toolbar = context.layoutInfo.toolbar,

        // options holds the Options Information from Summernote and what we extended above.
        options = context.options,

        // lang holds the Language Information from Summernote and what we extended above.
        lang = options.langInfo,

        // [workaround] IE doesn't have input events for contentEditable
        userAgent = navigator.userAgent,
        isSupportTouch = 'ontouchstart' in window || navigator.MaxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

      context.memo('button.videoUpload', function () {

        // Here we create a button
        var button = ui.button({

          // icon for button
          contents: options.videoUpload.icon,

          // tooltip for button
          tooltip: lang.videoUpload.video,

          // Keep button from being disabled when in CodeView
          codeviewKeepButton: true,

          click: function (e) {
            context.invoke('videoUpload.show');
          }
        });
        return button.render();
      });

      this.initialize = function () {

        // This is how we can add a Modal Dialog to allow users to interact with the Plugin.

        // get the correct container for the plugin how it's attached to the document DOM.
        // Using the current latest development branch, you can now use $.summernote.interface;
        // to return which Summernote is being used to be able to adjust the modal layout to suit.
        // using this.options.id will return a generated timestamp when Summernote was initiliased
        // on page to allow using unique ID's.
        var $container = options.dialogsInBody ? $(document.body) : $editor;

        var videoLimitation = '';
        if (options.maximumVideoFileSize) {
          var unit = Math.floor(Math.log(options.maximumVideoFileSize) / Math.log(1024));
          var readableSize = (options.maximumVideoFileSize / Math.pow(1024, unit)).toFixed(2) * 1 + ' ' + ' KMGTP' [unit] + 'B';
          videoLimitation = "<small>".concat(lang.videoUpload.maximumFileSize + ' : ' + readableSize, "</small>");
        }

        var videoUploadMessage = '<span class="note-help-block"></span>';

        // Build the Body HTML of the Dialog.
        var body = '<div class="note-form-group note-group-select-from-files">' + '<label for="note-dialog-video-file-' + options.id + '" class="note-form-label">' + lang.videoUpload.selectFromFiles + '</label>' + '<input id="note-dialog-video-file-' + options.id + '" class="note-video-input note-input" type="file" name="files" accept="video/*" multiple="multiple"/>' + videoLimitation + videoUploadMessage + '</div>' +
          '<div class="form-group note-form-group row-fluid">' + '<label for="note-dialog-video-url-' + options.id + '" class="note-form-label">' + lang.videoUpload.url + '<small class="text-muted">' + lang.videoUpload.providers + '</small></label>' + '<input id="note-dialog-video-url-' + options.id + '" class="note-video-url note-input" type="text"/>' + '</div>';

        // Build the Footer HTML of the Dialog.
        var footer = ['<button href="#" type="button" class="note-btn note-btn-primary note-btn-large note-video-btn disabled" disabled>', lang.videoUpload.insert, '</button>'].join('');

        this.$dialog = ui.dialog({

          // Set the title for the Dialog. Note: We don't need to build the markup for the Modal
          // Header, we only need to set the Title.
          title: lang.videoUpload.insert,

          fade: options.dialogsFade,

          // Set the Body of the Dialog.
          body: body,

          // Set the Footer of the Dialog.
          footer: footer

          // This adds the Modal to the DOM.
        }).render().appendTo($container);
      };

      this.destroy = function () {
        ui.hideDialog(this.$dialog);
        this.$dialog.remove();
      };

      this.bindEnterKey = function ($input, $btn) {
        $input.on('keypress', function (event) {
          if (event.keyCode === 13) $btn.trigger('click');
        });
      };

      this.bindLabels = function () {
        self.$dialog.find('.form-control:first').focus().select();
        self.$dialog.find('label').on('click', function () {
          $(this).parent().find('.form-control:first').focus();
        });
      };

      this.createVideoNode = function (url) {
        // video url patterns(youtube, instagram, vimeo, dailymotion, youku, mp4, ogg, webm)
        var ytRegExp = /\/\/(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w|-]{11})(?:(?:[\?&]t=)(\S+))?$/;
        var ytRegExpForStart = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/;
        var ytMatch = url.match(ytRegExp);
        var igRegExp = /(?:www\.|\/\/)instagram\.com\/p\/(.[a-zA-Z0-9_-]*)/;
        var igMatch = url.match(igRegExp);
        var vRegExp = /\/\/vine\.co\/v\/([a-zA-Z0-9]+)/;
        var vMatch = url.match(vRegExp);
        var vimRegExp = /\/\/(player\.)?vimeo\.com\/([a-z]*\/)*(\d+)[?]?.*/;
        var vimMatch = url.match(vimRegExp);
        var dmRegExp = /.+dailymotion.com\/(video|hub)\/([^_]+)[^#]*(#video=([^_&]+))?/;
        var dmMatch = url.match(dmRegExp);
        var youkuRegExp = /\/\/v\.youku\.com\/v_show\/id_(\w+)=*\.html/;
        var youkuMatch = url.match(youkuRegExp);
        var qqRegExp = /\/\/v\.qq\.com.*?vid=(.+)/;
        var qqMatch = url.match(qqRegExp);
        var qqRegExp2 = /\/\/v\.qq\.com\/x?\/?(page|cover).*?\/([^\/]+)\.html\??.*/;
        var qqMatch2 = url.match(qqRegExp2);
        var mp4RegExp = /^.+.(mp4|m4v)$/;
        var mp4Match = url.match(mp4RegExp);
        var oggRegExp = /^.+.(ogg|ogv)$/;
        var oggMatch = url.match(oggRegExp);
        var webmRegExp = /^.+.(webm)$/;
        var webmMatch = url.match(webmRegExp);
        var fbRegExp = /(?:www\.|\/\/)facebook\.com\/([^\/]+)\/videos\/([0-9]+)/;
        var fbMatch = url.match(fbRegExp);
        var $video;

        if (ytMatch && ytMatch[1].length === 11) {
          var youtubeId = ytMatch[1];
          var start = 0;

          if (typeof ytMatch[2] !== 'undefined') {
            var ytMatchForStart = ytMatch[2].match(ytRegExpForStart);

            if (ytMatchForStart) {
              for (var n = [3600, 60, 1], i = 0, r = n.length; i < r; i++) {
                start += typeof ytMatchForStart[i + 1] !== 'undefined' ? n[i] * parseInt(ytMatchForStart[i + 1], 10) : 0;
              }
            }
          }

          $video = $('<iframe>').attr('frameborder', 0).attr('src', '//www.youtube.com/embed/' + youtubeId + (start > 0 ? '?start=' + start : '')).attr('width', '640').attr('height', '360');
        } else if (igMatch && igMatch[0].length) {
          $video = $('<iframe>').attr('frameborder', 0).attr('src', 'https://instagram.com/p/' + igMatch[1] + '/embed/').attr('width', '612').attr('height', '710').attr('scrolling', 'no').attr('allowtransparency', 'true');
        } else if (vMatch && vMatch[0].length) {
          $video = $('<iframe>').attr('frameborder', 0).attr('src', vMatch[0] + '/embed/simple').attr('width', '600').attr('height', '600').attr('class', 'vine-embed');
        } else if (vimMatch && vimMatch[3].length) {
          $video = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>').attr('frameborder', 0).attr('src', '//player.vimeo.com/video/' + vimMatch[3]).attr('width', '640').attr('height', '360');
        } else if (dmMatch && dmMatch[2].length) {
          $video = $('<iframe>').attr('frameborder', 0).attr('src', '//www.dailymotion.com/embed/video/' + dmMatch[2]).attr('width', '640').attr('height', '360');
        } else if (youkuMatch && youkuMatch[1].length) {
          $video = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>').attr('frameborder', 0).attr('height', '498').attr('width', '510').attr('src', '//player.youku.com/embed/' + youkuMatch[1]);
        } else if (qqMatch && qqMatch[1].length || qqMatch2 && qqMatch2[2].length) {
          var vid = qqMatch && qqMatch[1].length ? qqMatch[1] : qqMatch2[2];
          $video = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>').attr('frameborder', 0).attr('height', '310').attr('width', '500').attr('src', 'https://v.qq.com/iframe/player.html?vid=' + vid + '&amp;auto=0');
        } else if (mp4Match || oggMatch || webmMatch) {
          $video = $('<video controls>').attr('src', url).attr('width', '640').attr('height', '360');
        } else if (fbMatch && fbMatch[0].length) {
          $video = $('<iframe>').attr('frameborder', 0).attr('src', 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(fbMatch[0]) + '&show_text=0&width=560').attr('width', '560').attr('height', '301').attr('scrolling', 'no').attr('allowtransparency', 'true');
        } else {
          // this is not a known video link. Now what, Cat? Now what?
          return false;
        }

        $video.addClass('note-video-clip');
        return $video[0];
      };

      /**
       * @method readFileAsDataURL
       *
       * read contents of file as representing URL
       *
       * @param {File} file
       * @return {Promise} - then: dataUrl
       */
      this.readFileAsDataURL = function (file) {
        return $.Deferred(function (deferred) {
          $.extend(new FileReader(), {
            onload: function onload(e) {
              var dataURL = e.target.result;
              deferred.resolve(dataURL);
            },
            onerror: function onerror(err) {
              deferred.reject(err);
            }
          }).readAsDataURL(file);
        }).promise();
      }

      /**
       * @method createVideo
       *
       * create `<video>` from url string
       *
       * @param {String} url
       * @return {Promise} - then: $video
       */
      this.createVideo = function (url) {
        return $.Deferred(function (deferred) {
          // video file patterns(mp4, avi, flv, wmv, mov)
          var videoRegExp = /^.+.(mp4|avi|flv|wmv|mov)$/;
          var videoMatch = url.match(videoRegExp);
          var base64RegExp = /^data:(video\/mp4|video\/x-msvideo|video\/x-flv|video\/quicktime).+$/;
          var base64Match = url.match(base64RegExp);
          var $video;

          if (videoMatch || base64Match) {
            $video = $('<video controls>').attr('src', url).attr('width', '640').attr('height', '360');

            deferred.resolve($video);
          } else {
            deferred.reject($video);
          }
        }).promise();
      }

      /**
       * insert video
       *
       * @param {String} src
       * @param {String|Function} param
       * @return {Promise}
       */
      this.insertVideo = function (src, param) {
        return self.createVideo(src, param).then(function ($video) {
          context.invoke('editor.beforeCommand');

          if (typeof param === 'function') {
            param($video);
          } else {
            if (typeof param === 'string') {
              $video.attr('data-filename', param);
            }

            $video.addClass('note-video-clip');
          }

          $video.show();

          // insert video node
          context.invoke('editor.insertNode', $video[0]);

          context.invoke('editor.afterCommand');
        }).fail(function (e) {
          context.triggerEvent('video.upload.error', e);
        });
      };

      /**
       * insertVideos
       * @param {File[]} files
       */
      this.insertVideosAsDataURL = function (files) {
        $.each(files, function (idx, file) {
          var filename = file.name;

          if (options.maximumVideoFileSize && options.maximumVideoFileSize < file.size) {
            context.triggerEvent('video.upload.error', lang.videoUpload.maximumFileSizeError);
          } else {
            self.readFileAsDataURL(file).then(function (dataURL) {
              return self.insertVideo(dataURL, filename);
            }).fail(function () {
              context.triggerEvent('video.upload.error');
            });
          }
        });
      }

      /**
       * insertVideosOrCallback
       * @param {File[]} files
       */
      this.insertVideosOrCallback = function (files) {
        var callbacks = options.callbacks; // If onVideoUpload set,

        // video file
        // If onVideoUpload set,
        if (callbacks.onVideoUpload) {
          context.triggerEvent('video.upload', files); // else insert Video as base64
        } else {
          // [workaround] hide dialog before restore range for IE range focus
          ui.hideDialog(self.$dialog);

          context.invoke('editor.restoreRange'); // build node

          self.insertVideosAsDataURL(files);
        }
      };

      /**
       * insertVideoLinkOrCallback
       * @param {String} url
       */
      this.insertVideoLinkOrCallback = function (url) {
        var callbacks = options.callbacks; // If onVideoLinkInsert set,

        // video url
        // If onVideoLinkInsert set,
        if (callbacks.onVideoLinkInsert) {
          context.triggerEvent('video.link.insert', url); // else insert Video as dataURL
        } else {
          // [workaround] hide dialog before restore range for IE range focus
          ui.hideDialog(self.$dialog);

          context.invoke('editor.restoreRange'); // build node

          var $node = self.createVideoNode(url);
          if ($node) {
            // insert video node
            context.invoke('editor.insertNode', $node);
          }
        }
      };

      /**
       * showVideoUploadMessage
       * @param {String} text
       */
      this.showVideoUploadMessage = function (text) {
        // Show the message
        self.$dialog.find('.note-help-block').empty().append(text).addClass('active');
      };

      /**
       * hideVideoUploadMessage
       */
      this.hideVideoUploadMessage = function () {
        // Hide the message
        self.$dialog.find('.note-help-block').removeClass('active').empty();
      };

      this.show = function (data) {
        var text = context.invoke('editor.getSelectedText');
        context.invoke('editor.saveRange');

        self.showVideoUploadDialog(text).then(function (data) {
          if (typeof data === 'string') {
            self.insertVideoLinkOrCallback(data);
          } else {
            // array of files
            self.insertVideosOrCallback(data);
          }
        }).fail(function () {
          context.invoke('editor.restoreRange');
        });
      };

      this.showVideoUploadDialog = function (editorInfo) {
        return $.Deferred(function (deferred) {
          var $videoInput = self.$dialog.find('.note-video-input');

          var $videoUrl = self.$dialog.find('.note-video-url');

          var $videoBtn = self.$dialog.find('.note-video-btn');

          ui.onDialogShown(self.$dialog, function () {
            self.hideVideoUploadMessage();

            context.triggerEvent('dialog.shown');

            $videoInput.replaceWith($videoInput.clone().on('change', function (event) {
              deferred.resolve(event.target.files || event.target.value);
            }).val(''));

            $videoUrl.on('input paste propertychange', function () {
              ui.toggleBtn($videoBtn, $videoUrl.val());
            });

            if (!self.isSupportTouch) {
              $videoUrl.trigger('focus');
            }

            $videoBtn.click(function (event) {
              event.preventDefault();
              deferred.resolve($videoUrl.val());
            });

            self.bindEnterKey($videoUrl, $videoBtn);
          });

          ui.onDialogHidden(self.$dialog, function () {
            $videoInput.off();
            $videoUrl.off();
            $videoBtn.off();

            if (deferred.state() === 'pending') {
              deferred.reject();
            }
          });

          ui.showDialog(self.$dialog);
        });
      };
    }
  });
}));
