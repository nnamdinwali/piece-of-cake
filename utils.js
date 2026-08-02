var FULLSCREEN_CALLBACK_MSG = "fullscreen_callback";

function showCopyUI(text, copyButtonText) {
	const overlay = document.createElement("div");
	const container = document.createElement("div");
	const content = document.createElement("div");
	const textarea = document.createElement("textarea");
	const btnCopy = document.createElement("button");
	const btnClose = document.createElement("button");

	overlay.classList.add("copy-ui-overlay");
	container.classList.add("copy-ui-container");
	content.classList.add("copy-ui-content");
	textarea.classList.add("copy-ui-textarea");
	btnCopy.classList.add("copy-ui-button");
	btnClose.classList.add("copy-ui-close");

	textarea.value = text;
	btnCopy.textContent = copyButtonText;
	btnClose.innerHTML = "&times;";

	setTimeout(() => textarea.select(), 0);
	textarea.setSelectionRange(0, textarea.value.length);

	btnCopy.addEventListener("click", function () {
		textarea.select();
		textarea.setSelectionRange(0, textarea.value.length);
		try {
			navigator.clipboard
				.writeText(textarea.value)
				.then(() => {
					if (overlay.parentNode) document.body.removeChild(overlay);
				})
				.catch((err) => {
					console.warn("Copy command was unsuccessful using modern API, trying fallback.", err);
					if (document.execCommand("copy")) {
						if (overlay.parentNode) document.body.removeChild(overlay);
					} else {
						console.warn("Fallback copy command was also unsuccessful.");
					}
				});
		} catch (err) {
			console.error("Copy to clipboard failed", err);
		}
	});

	const closeUI = () => {
		if (overlay.parentNode) {
			document.body.removeChild(overlay);
		}
	};

	btnClose.addEventListener("click", closeUI);
	overlay.addEventListener("click", function (e) {
		if (e.target === overlay) {
			closeUI();
		}
	});

	content.appendChild(textarea);
	content.appendChild(btnCopy);
	container.appendChild(btnClose);
	container.appendChild(content);
	overlay.appendChild(container);
	document.body.appendChild(overlay);
}

async function universalCopy(text, copyButtonText) {
	copyButtonText = copyButtonText ? copyButtonText : "Copy";

	if (navigator.clipboard && navigator.clipboard.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return;
		} catch (err) {
			console.warn("Unable to copy via Clipboard API, trying another method.", err);
		}
	}

	const textArea = document.createElement("textarea");
	textArea.value = text;
	Object.assign(textArea.style, {
		position: "fixed",
		top: "-9999px",
		left: "-9999px"
	});

	document.body.appendChild(textArea);
	textArea.select();

	let success = false;
	try {
		success = document.execCommand("copy");
	} catch (err) {
		console.error("Error while executing execCommand", err);
	}

	document.body.removeChild(textArea);

	if (success) {
		return;
	}

	console.warn("All automatic copy methods failed. Showing UI.");
	showCopyUI(text, copyButtonText);
}

function waitUntilCondition(conditionFn, callbackFn, interval = 100) {
	const intervalId = setInterval(() => {
		if (conditionFn()) {
			clearInterval(intervalId);
			callbackFn();
		}
	}, interval);
}

var platform_utils = {
	isMobile: function () {
		let check = false;
		(function (a) {
			if (
				/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
					a
				) ||
				/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
					a.substr(0, 4)
				)
			)
				check = true;
		})(navigator.userAgent || navigator.vendor || window.opera);
		return check;
	},
    isWindows: function() {
        return navigator.userAgent.indexOf('Windows') !== -1;
    },
	enterFullscreen: function () {
		let elem = document.documentElement;
		if (elem.requestFullscreen) {
			elem.requestFullscreen();
		} else if (elem.mozRequestFullScreen) {
			// Firefox
			elem.mozRequestFullScreen();
		} else if (elem.webkitRequestFullscreen) {
			// Chrome, Safari and Opera
			elem.webkitRequestFullscreen();
		} else if (elem.msRequestFullscreen) {
			// IE/Edge
			elem.msRequestFullscreen();
		}
	},
	exitFullscreen: function () {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.mozCancelFullScreen) {
			// Firefox
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
			// Chrome, Safari and Opera
			document.webkitExitFullscreen();
		} else if (document.msExitFullscreen) {
			// IE/Edge
			document.msExitFullscreen();
		}
	},
	isFullscreen: function () {
		return document.fullscreenElement ||
			document.mozFullScreenElement ||
			document.webkitFullscreenElement ||
			document.msFullscreenElement
			? true
			: false;
	},

	toggleFullscreen: function () {
		if (this.isFullscreen()) {
			this.exitFullscreen();
		} else {
			this.enterFullscreen();
		}
	},
	onFullscreenChange: function () {
		JsToDef.send(FULLSCREEN_CALLBACK_MSG);
	},
	copyText: function (text, copyButtonText) {
		if (typeof universalCopy === "function") {
			universalCopy(text, copyButtonText);
		} else {
			console.error("universalCopy function is not defined. Make sure copy-utils.js is loaded.");
		}
	}
};

document.addEventListener("fullscreenchange", function () {
	platform_utils.onFullscreenChange();
});
document.addEventListener("mozfullscreenchange", function () {
	platform_utils.onFullscreenChange();
});
document.addEventListener("webkitfullscreenchange", function () {
	platform_utils.onFullscreenChange();
});
document.addEventListener("msfullscreenchange", function () {
	platform_utils.onFullscreenChange();
});
