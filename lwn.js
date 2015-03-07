/*
 * Copyright (c) 2015 Polyvations Pty Ltd
 * Copyright (c) 2015 Andrew Pollock
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function getAndSetTitle(request, url, rewritten) {
  return function() {
    var link = url;

    if (request.readyState == 4) {
      console.log('Attempting to parse ' + link);
      var parser = new DOMParser();
      var dom = parser.parseFromString(request.responseText, 'text/html');
      // TODO(apollock): check if anything malicious can be injected in here
      var title = dom.title;
      // This makes me sad, but seems to be the only way to safely operate on
      // the right link. The index into document.links doesn't seem to stay
      // stable between the intial iteration over it and when the callback
      // fires.
      if (rewritten) {
        link = link.replace(/^https:/i, 'http:');
      }
      console.log('Searching for ' + link);
      for (i = 0; i < document.links.length; i++) {
        if (document.links.item(i).href == link) {
          console.log('Setting title to ' + title);
          document.links.item(i).title = title;
          if (document.links.item(i).title != title) {
            console.log('Setting titled failed!');
          }
          // And we can't even break out of the loop early, because the same
          // link could appear multiple times. Sadness to the extreme.
          // break;
        }
      }
    }
  }
}

function setTitle(url, rewritten) {
  var xhr = new XMLHttpRequest();

  xhr.open('GET', url, true);
  var callback = getAndSetTitle(xhr, url, rewritten);
  xhr.onreadystatechange = callback;
  xhr.send();
}

for (i = 0; i < document.links.length; i++) {
  var lwnArticleUrl = /^(http[s]?:)\/\/lwn\.net\/Articles\//i;

  if (lwnArticleUrl.test(document.links.item(i).href) &&
      document.links.item(i).title == '') {
    var link = document.links.item(i).href;
    var rewritten = false;

    // If we're HTTPS and one of the links is an absolute HTTP link, rewrite it
    // to HTTPS to avoid a mixed content failure
    if (window.location.protocol == 'https:') {
      var matches = lwnArticleUrl.exec(document.links.item(i).href);
      if (matches[1] != 'https:') {
        console.log('Remapping protocol to HTTPS for ' + link);
        link = link.replace(/^http:/i, 'https:');
        rewritten = true;
      }
    }
    console.log('Calling setTitle() for link ' + i + ', which is ' + link +
        ' with rewritten = ' + rewritten);
    setTitle(link, rewritten);
  }
}
