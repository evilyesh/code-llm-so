/**
 * Utility functions collection:
 * - DOM manipulation helpers
 * - String manipulation functions
 * - Helper functions for various components
 */
const oPb = {
	docReady(cb) {
		if (document.readyState !== 'loading') cb();
		else document.addEventListener('DOMContentLoaded', cb);
	},
	showSmMsg(msg, cls, dur = 1000) {
		let b = document.querySelector('.pb_smmsg_b') || createEl('div').addClass('pb_smmsg_b').appendTo(document.body);
		if (msg) {
			let w = createEl('div').addClass('pb_smmsg_w').addClass(cls).setHTML(msg).appendTo(b);
			setTimeout(() => w.removeClass('op_0'), 10);
			if (dur > 0) setTimeout(() => w.remove(), dur + 500);
			return w;
		}
		return false;
	},
};

Number.isFinite = Number.isFinite || function(v) { return typeof v === 'number' && isFinite(v); };

if (!window.extend) {
	window.extend = (a, b) => {
		for (let k in b) if (b.hasOwnProperty(k)) a[k] = b[k];
		return a;
	};
}

if (!Element.prototype.remove) {
	Element.prototype.remove = function() { this.parentElement.removeChild(this); };
}

['add', 'remove', 'toggle'].forEach(m => {
	Element.prototype[`${m}Class`] = function(c) {
		this.classList[m](c);
		return this;
	};
});

['setId', 'setType', 'setValue', 'setAttr'].forEach(m => {
	Element.prototype[m] = function(v) { this[m.slice(3).toLowerCase()] = v; return this; };
});

Element.prototype.setTEXT = function(v) { this.textContent = v; return this; };
Element.prototype.setHTML = function(v) { this.innerHTML = v; return this; };
Element.prototype.setId = function(v) { this.id = v; return this; };

Element.prototype.addData = function(n, v) { this.dataset[n] = v; return this; };
Element.prototype.getData = function(n) { return this.dataset[n]; };
Element.prototype.getAttr = function(n) { return this.getAttribute(n); };
Element.prototype.getFullHeight = function() { return this.offsetTop + this.offsetHeight; };
Element.prototype.getOneSelector = function(s) { return this.querySelector(s); };
Element.prototype.getManySelector = function(s) { return this.querySelectorAll(s); };
Element.prototype.onClick = function(cb) { this.addEventListener('click', e => { e.preventDefault(); cb(e); }); return this; };
Element.prototype.getSiblings = function() {
	let s = [];
	if (this.parentNode) {
		for (let sib = this.parentNode.firstChild; sib; sib = sib.nextSibling) {
			if (sib.nodeType === 1 && sib !== this) s.push(sib);
		}
	}
	return s;
};
Element.prototype.showHide = function() { this.style.display = this.style.display === 'none' ? '' : 'none'; return this; };
Element.prototype.appendTo = function(e) { e.append(this); return this; };

function getOneSelector(s) { return document.querySelector(s); }
function getManySelector(s) { return document.querySelectorAll(s); }
function createEl(t) { return document.createElement(t); }
function getById(id) { return document.getElementById(id); }

function escapeHtml(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function unescapeHtml(safe) {
	return safe
		.replace(/&/g, "&")
		.replace(/</g, "<")
		.replace(/>/g, ">")
		.replace(/"/g, '"')
		.replace(/'/g, "'");
}

function simpleHash(str) {
	let hash = 0;
	if (str.length === 0) return hash;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return hash;
}

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceFourSpacesWithTab(text) {
	const pattern = / {4}/g;
	return text.replace(pattern, '\t');
}

function replaceTabWithFourSpaces(text) {
	return text.replace(/\t/g, '	');
}

function nl2br(str) {
  if (typeof str === 'undefined' || str === null) {
	return '';
  }
  return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
}

function createShortString(longString) {
	if (longString.length <= 20) return longString;
	return '...' + longString.substring(longString.length - 20);
}

function escapeAndFormatContent(content) {
	return nl2br(escapeHtml(content));
}

function splitTextInHtml(escaped_text, known_keys, unknown_keys, markdown_keys) {
	const ar_text = splitByDelimiters(escaped_text, [...known_keys, ...unknown_keys, ...markdown_keys]);
	const html = createEl('div').addClass('message_g_wrapper');
	ar_text.forEach(block => {
		const message_block = createEl('div').addClass('message_block');
		if(known_keys.includes(block)){
			message_block.id = block;
		}else if(unknown_keys.includes(block)){
			message_block.id = block;
		}else if(markdown_keys.includes(block)){
			message_block.id = block;
		}else{
			message_block.innerHTML = block;
		}
		html.append(message_block)
	});

	return html;
}

function splitByDelimiters(text, delimiters) {
	if(!delimiters.length) return [text];

	const escaped = delimiters.map(d =>
		d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	);
	escaped.sort((a, b) => b.length - a.length);
	const pattern = new RegExp(`(${escaped.join('|')})`, 'g');

	return text.split(pattern).filter(part => part !== '');
}

function removeMarkdownAndCodeLanguage(text) {
	text = text.replace(/^```\w+.*\n/gm, '');

	text = text.replace(/^`{3}/gm, '');
	text = text.replace(/`{3}$/gm, '');

	return text.trim();
}