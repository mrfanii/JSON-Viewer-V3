var CodeMirror = require('codemirror');
require('codemirror/addon/fold/foldcode');
require('codemirror/addon/fold/foldgutter');
require('codemirror/addon/fold/brace-fold');
require('codemirror/addon/dialog/dialog');
require('codemirror/addon/scroll/annotatescrollbar');
require('codemirror/addon/search/matchesonscrollbar');
require('codemirror/addon/search/searchcursor');
require('codemirror/addon/search/search');
require('codemirror/mode/javascript/javascript');

var merge = require('./merge');
var defaults = require('./options/defaults');
var URL_PATTERN = require('./url-pattern');
var F_LETTER = 70;

function Highlighter(jsonText, options) {
  this.options = options || {};
  this.text = jsonText;
  this.defaultSearch = false;
  this.theme = this.options.theme || 'default';
  this.theme = this.theme.replace(/_/, ' ');
}

Highlighter.prototype = {
  highlight: function() {
    this.editor = CodeMirror(document.body, this.getEditorOptions());
    if (!this.alwaysRenderAllContent()) this.preventDefaultSearch();
    if (this.isReadOnly()) this.getDOMEditor().classList.add('read-only');

    this.bindRenderLine();
    this.bindMousedown();
    this.editor.refresh();
    this.editor.focus();
  },

  hide: function() {
    this.getDOMEditor().hidden = true;
    this.defaultSearch = true;
  },

  show: function() {
    this.getDOMEditor().hidden = false;
    this.defaultSearch = false;
  },

  getDOMEditor: function() {
    return document.querySelector('.CodeMirror');
  },

  fold: function() {
    let skippedRoot = false;
    const firstLine = this.editor.firstLine();
    const lastLine = this.editor.lastLine();

    for (let line = firstLine; line <= lastLine; line++) {
      if (!skippedRoot) {
        if (/(\[|\{)/.test(this.editor.getLine(line).trim())) skippedRoot = true;
      } else {
        this.editor.foldCode({ line: line, ch: 0 }, null, 'fold');
      }
    }
  },

  unfoldAll: function() {
    for (let line = 0; line < this.editor.lineCount(); line++) {
      this.editor.foldCode({ line: line, ch: 0 }, null, 'unfold');
    }
  },

  bindRenderLine: function() {
    this.editor.off('renderLine');
    this.editor.on('renderLine', (cm, line, element) => {
      const elementsNode = element.getElementsByClassName('cm-string');
      if (!elementsNode || elementsNode.length === 0) return;

      const elements = Array.from(elementsNode);

      const textContent = elements.reduce((str, node) => str + node.textContent, '');
      const text = this.removeQuotes(textContent);

      if (text.match(URL_PATTERN) && this.clickableUrls()) {
        const decodedText = this.decodeText(text);
        elements.forEach(node => {
          if (this.wrapLinkWithAnchorTag()) {
            const linkTag = document.createElement('a');
            linkTag.href = decodedText;
            linkTag.target = '_blank';
            linkTag.classList.add('cm-string');

            node.childNodes.forEach(child => linkTag.appendChild(child));
            linkTag.addEventListener('contextmenu', e => e.stopPropagation());

            node.appendChild(linkTag);
          } else {
            node.classList.add('cm-string-link');
            node.dataset.url = decodedText;
          }
        });
      }
    });
  },

  bindMousedown: function() {
    this.editor.off('mousedown');
    this.editor.on('mousedown', (cm, event) => {
      const element = event.target;
      if (element.classList.contains('cm-string-link')) {
        const url = element.dataset.url;
        const target = this.openLinksInNewWindow() ? '_blank' : '_self';
        window.open(url, target);
      }
    });
  },

  removeQuotes: function(text) {
    return text.replace(/^\"+/, '').replace(/\"+$/, '');
  },

  includeQuotes: function(text) {
    return `"${text}"`;
  },

  decodeText: function(text) {
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.firstChild ? div.firstChild.nodeValue : '';
  },

  getEditorOptions: function() {
    const obligatory = {
      value: this.text,
      theme: this.theme,
      readOnly: this.isReadOnly(),
      mode: 'application/ld+json',
      indentUnit: 2,
      tabSize: 2,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      extraKeys: this.getExtraKeysMap()
    };

    if (this.alwaysRenderAllContent()) {
      obligatory.viewportMargin = Infinity;
    }

    const optional = defaults.structure;
    const configured = this.options.structure;

    return merge({}, optional, configured, obligatory);
  },

  getExtraKeysMap: function() {
    const extraKeyMap = {
      'Esc': cm => {
        CodeMirror.commands.clearSearch(cm);
        cm.setSelection(cm.getCursor());
        cm.focus();
      }
    };

    if (this.options.structure.readOnly) {
      extraKeyMap['Enter'] = cm => CodeMirror.commands.findNext(cm);
      extraKeyMap['Shift-Enter'] = cm => CodeMirror.commands.findPrev(cm);
      extraKeyMap['Ctrl-V'] = extraKeyMap['Cmd-V'] = cm => {}; // Prevent default paste behavior
    }

    const nativeSearch = this.alwaysRenderAllContent();
    extraKeyMap['Ctrl-F'] = nativeSearch ? false : this.openSearchDialog;
    extraKeyMap['Cmd-F'] = nativeSearch ? false : this.openSearchDialog;
    return extraKeyMap;
  },

  preventDefaultSearch: function() {
    document.addEventListener('keydown', e => {
      const metaKey = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey;
      if (!this.defaultSearch && e.keyCode === F_LETTER && metaKey) {
        e.preventDefault();
      }
    });
  },

  openSearchDialog: function(cm) {
    cm.setCursor({ line: 0, ch: 0 });
    CodeMirror.commands.find(cm);
  },

  alwaysRenderAllContent: function() {
    return this.options.addons.alwaysRenderAllContent || this.options.addons.awaysRenderAllContent;
  },

  clickableUrls: function() {
    return this.options.addons.clickableUrls;
  },

  wrapLinkWithAnchorTag: function() {
    return this.options.addons.wrapLinkWithAnchorTag;
  },

  openLinksInNewWindow: function() {
    return this.options.addons.openLinksInNewWindow;
  },

  isReadOnly: function() {
    return this.options.structure.readOnly;
  }
};

module.exports = Highlighter;
