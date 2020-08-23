# summernote-video-upload
You can embed Base64-encoded video data in Summernote. Also upload a video file using callback.

## Requirement

* summernote v0.8.16

## Installation

Include the following code after including Summernote.

```javascript
<link rel="stylesheet" href="summernote-video-upload/summernote-video-upload.css">
<script src="summernote-video-upload/summernote-video-upload.js"></script>
```

## Usage

Initialize Summernote with the videoUpload plugin.

```javascript
$(function() {
  /**
   * Initialize summernote
   */
  $('.summernote').summernote({
    lang: "ja-JP",
    toolbar: [
      ['insert', ['videoUpload']]
    ],
    callbacks: { // You can use callback.
      onVideoUpload: function(files) {
        sendVideoFile(files[0], $(this));
      }
    }
  });
});
```

If you want to change the maximum size of the video file, change this value in summernote-video-upload.js.

```javascript
$.extend($.summernote.options, {
  maximumVideoFileSize: 4294967296
});
```

"summernote-video-upload.js" allows only video file patterns .mp4, .avi, .flv, .wmv and .mov.<br>
However, you can change it in the createVideo method.

```javascript
var videoRegExp = /^.+.(mp4|avi|flv|wmv|mov)$/;
var videoMatch = url.match(videoRegExp);
var base64RegExp = /^data:(video\/mp4|video\/x-msvideo|video\/x-flv|video\/quicktime).+$/;
var base64Match = url.match(base64RegExp);
```

## License

"summernote-video-upload" is under [MIT license](https://en.wikipedia.org/wiki/MIT_License).
