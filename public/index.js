"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("uv-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("uv-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("uv-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("uv-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("uv-error-code");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

if (form) {
	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		try {
			await registerSW();
		} catch (err) {
			if (error) error.textContent = "Failed to register service worker.";
			if (errorCode) errorCode.textContent = err.toString();
			throw err;
		}

		const url = search(address.value, searchEngine.value);

		let frame = document.getElementById("uv-frame");
		if (frame) {
			// Hide homepage and show frame
			if (homepageContainer) homepageContainer.style.display = 'none';
			if (topBar) topBar.style.display = 'none';
			frame.style.display = "block";
			let wispUrl =
				(location.protocol === "https:" ? "wss" : "ws") +
				"://" +
				location.host +
				"/wisp/";
			if ((await connection.getTransport()) !== "/epoxy/index.mjs") {
				await connection.setTransport("/epoxy/index.mjs", [
					{ wisp: wispUrl },
				]);
			}
			frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
		}
	});
}

// Navigation bar functionality
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const refreshBtn = document.getElementById('refresh-btn');
const tabBtn = document.getElementById('tab-btn');
const settingsMenuBtn = document.getElementById('settings-menu-btn');
const settingsDropdown = document.getElementById('settings-dropdown');
const dropdownSettings = document.getElementById('dropdown-settings');
const dropdownAi = document.getElementById('dropdown-ai');
const uvFrame = document.getElementById('uv-frame');
const homepageContainer = document.querySelector('.main-grid');

// Track navigation history
const navHistory = [];
let historyIndex = -1;

if (backBtn) {
	backBtn.addEventListener('click', () => {
		if (uvFrame && uvFrame.contentWindow) {
			uvFrame.contentWindow.history.back();
		}
	});
}

if (forwardBtn) {
	forwardBtn.addEventListener('click', () => {
		if (uvFrame && uvFrame.contentWindow) {
			uvFrame.contentWindow.history.forward();
		}
	});
}

if (refreshBtn) {
	refreshBtn.addEventListener('click', () => {
		if (uvFrame && uvFrame.style.display !== 'none') {
			uvFrame.src = uvFrame.src;
		}
	});
}

if (tabBtn) {
	tabBtn.addEventListener('click', () => {
		window.open(location.href, '_blank');
	});
}

if (settingsMenuBtn) {
	settingsMenuBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		settingsDropdown.style.display = settingsDropdown.style.display === 'none' ? 'block' : 'none';
	});
}

if (dropdownSettings) {
	dropdownSettings.addEventListener('click', (e) => {
		e.preventDefault();
		settingsDropdown.style.display = 'none';
		document.querySelector('.settings-btn').click();
	});
}

if (dropdownAi) {
	dropdownAi.addEventListener('click', (e) => {
		e.preventDefault();
		settingsDropdown.style.display = 'none';
		document.querySelector('.ai-panel-open').click();
	});
}

// Close dropdown when clicking elsewhere
document.addEventListener('click', (e) => {
	if (!settingsMenuBtn.contains(e.target) && !settingsDropdown.contains(e.target)) {
		settingsDropdown.style.display = 'none';
	}
});

// Settings functionality
document.querySelector('.settings-btn').addEventListener('click', () => {
	const panel = document.getElementById('settings-panel');
	if (panel.classList.contains('show')) {
		panel.classList.remove('show');
		setTimeout(() => panel.style.display = 'none', 300); // wait for transition
	} else {
		panel.style.display = 'block';
		setTimeout(() => panel.classList.add('show'), 10); // small delay to trigger transition
	}
});

// Close panel when clicking outside
document.addEventListener('click', (e) => {
	const panel = document.getElementById('settings-panel');
	const btn = document.querySelector('.settings-btn');
	if (!panel.contains(e.target) && !btn.contains(e.target) && panel.classList.contains('show')) {
		panel.classList.remove('show');
		setTimeout(() => panel.style.display = 'none', 300);
	}
});

const topBar = document.querySelector('.top-bar');
const topTrigger = document.querySelector('.top-trigger');
let topBarTimer = null;

function showTopBar() {
	topBar.classList.add('visible');
	clearTimeout(topBarTimer);
	topBarTimer = setTimeout(() => {
		topBar.classList.remove('visible');
	}, 3000);
}

function resetTopBarTimer() {
	clearTimeout(topBarTimer);
	topBarTimer = setTimeout(() => {
		topBar.classList.remove('visible');
	}, 3000);
}

topTrigger.addEventListener('mouseenter', showTopBar);
topBar.addEventListener('mouseenter', resetTopBarTimer);
topBar.addEventListener('mouseleave', () => {
	topBarTimer = setTimeout(() => {
		topBar.classList.remove('visible');
	}, 3000);
});

const aiPanel = document.getElementById('ai-panel');
const aiPanelOpenButton = document.querySelector('.ai-panel-open');
const aiMessageInput = document.getElementById('ai-message-input');
const aiSendButton = document.getElementById('ai-send-message');
const aiClearChatButton = document.getElementById('ai-clear-chat');
const aiChatWindow = document.getElementById('ai-chat-window');
const aiStatus = document.getElementById('ai-status');

aiPanelOpenButton?.addEventListener('click', openAiPanel);
aiSendButton?.addEventListener('click', sendAiMessage);
aiMessageInput?.addEventListener('keydown', (e) => {
	if (e.key === 'Enter') {
		e.preventDefault();
		sendAiMessage();
	}
});
aiClearChatButton?.addEventListener('click', clearAiChat);

document.querySelector('.close-ai-panel')?.addEventListener('click', closeAiPanel);
document.addEventListener('click', (e) => {
	if (e.target === aiPanel) {
		closeAiPanel();
	}
});

function openAiPanel() {
	if (!aiPanel) return;
	aiPanel.style.display = 'block';
	setTimeout(() => aiPanel.classList.add('show'), 10);
	setAiStatus('Ready to chat.');
	aiMessageInput?.focus();
}

function closeAiPanel() {
	if (!aiPanel) return;
	aiPanel.classList.remove('show');
	setTimeout(() => {
		aiPanel.style.display = 'none';
	}, 300);
}

function setAiStatus(message) {
	if (aiStatus) {
		aiStatus.textContent = message;
	}
}

function addAiMessage(text, sender) {
	if (!aiChatWindow) return;
	const message = document.createElement('div');
	message.className = `ai-message ${sender}`;
	message.textContent = text;
	aiChatWindow.appendChild(message);
	aiChatWindow.scrollTop = aiChatWindow.scrollHeight;
}

function clearAiChat() {
	if (aiChatWindow) {
		aiChatWindow.innerHTML = '';
	}
	setAiStatus('Chat cleared. Ready.');
}

function sendAiMessage() {
	if (!aiMessageInput) return;
	const prompt = aiMessageInput.value.trim();
	if (!prompt) return;
	addAiMessage(prompt, 'user');
	aiMessageInput.value = '';
	setAiStatus('Thinking...');
	const personality = localStorage.getItem('aiPersonality') || 'friendly';
	setTimeout(() => {
		addAiMessage(generateAiReply(prompt, personality), 'bot');
		setAiStatus('Ready to chat.');
	}, 700);
}

function generateAiReply(prompt, personality) {
	const lower = prompt.toLowerCase().trim();
	let reply = 'I\'m here to help! Can you tell me more about what you need?';
	
	// Greeting patterns
	if (/^(hello|hi|hey|greetings|sup|yo)\b/.test(lower)) {
		reply = 'Hello! I\'m ThunderbirdAI. How can I assist you today?';
	} 
	// Status questions
	else if (/how are you|how are u|how\'s it|you okay/.test(lower)) {
		reply = 'I\'m functioning perfectly and ready to help! What can I do for you?';
	}
	// Name questions
	else if (/what.*your name|who are you|who am i talking|introduce/.test(lower)) {
		reply = 'I\'m ThunderbirdAI, your personal assistant built into Thunderbird. I\'m here to help with questions!';
	}
	// Theme questions
	else if (/theme|look|style|design|appear/.test(lower)) {
		reply = 'You can customize themes using the Settings panel on the left. Try Dark Blue, Light, Neon, Sunset, Matrix, Midnight, Aurora, or Cyber for different aesthetics!';
	}
	// Settings questions
	else if (/settings|option|configure|feature/.test(lower)) {
		reply = 'In Settings, you can change themes, search engine, enable/disable animations and particles, adjust font size, set AI personality, and more!';
	}
	// Proxy/search questions
	else if (/proxy|search|how to use|get started|unblock/.test(lower)) {
		reply = 'Thunderbird is a secure proxy that lets you search freely on any network. Just type your search query in the search bar and press Enter to get started!';
	}
	// AI questions
	else if (/personality|friendly|direct|creative|how do you|respond/.test(lower)) {
		reply = 'I can adapt my personality! You can set me to Friendly, Direct, or Creative in the AI Personality setting. Each changes how I communicate with you.';
	}
	// Help/unclear
	else if (/help|what can|what do|how can|support/.test(lower)) {
		reply = 'I can help with questions about Thunderbird features, themes, settings, search tips, and general questions. Feel free to ask me anything!';
	}
	// Particles
	else if (/particle/.test(lower)) {
		reply = 'You can enable particle effects in the Settings under "Enable particles". They add a nice visual effect to your background!';
	}
	// Animation
	else if (/animation|move|motion/.test(lower)) {
		reply = 'Animations are enabled by default but you can toggle them in Settings. Disabling them improves performance on slower devices.';
	}
	// School/network
	else if (/school|network|blocked|filter/.test(lower)) {
		reply = 'Thunderbird uses advanced proxy technology to bypass network filters safely. Use it responsibly to access educational resources!';
	}
	// Compliment/appreciation
	else if (/thank|awesome|great|love|cool|nice/.test(lower)) {
		reply = 'Thanks! I\'m glad you\'re enjoying Thunderbird. Feel free to explore all the themes and settings available!';
	}
	// Questions about Thunderbird creator
	else if (/who made|creator|author|developer|ret/.test(lower)) {
		reply = 'Thunderbird was created by ret. It\'s a sophisticated web proxy project built to be fast and secure!';
	}
	// General acknowledgment
	else {
		reply = `I understand you asked about "${prompt.substring(0, 50)}". I\'m still learning, but feel free to ask me anything about Thunderbird or get help with features!`;
	}
	
	// Apply personality modifiers
	if (personality === 'direct') {
		reply = reply.replace(/^I\'m/i, 'I').replace(/Feel free to ask|I\'m here to/g, (m) => m === 'Feel free to ask' ? 'Ask' : 'I');
		reply = reply.replace(/\s+/g, ' ').trim();
	} else if (personality === 'creative') {
		if (!reply.includes('✨')) {
			reply += ' ✨';
		}
	}
	
	return reply;
}

// Theme switching
document.querySelectorAll('.theme-btn').forEach(btn => {
	btn.addEventListener('click', () => {
		const theme = btn.dataset.theme;
		switchTheme(theme);
		localStorage.setItem('theme', theme);
	});
});

// Search engine change
document.getElementById('search-engine-select').addEventListener('change', (e) => {
	document.getElementById('uv-search-engine').value = e.target.value;
	localStorage.setItem('searchEngine', e.target.value);
});

// Other settings
document.getElementById('auto-focus').addEventListener('change', (e) => {
	localStorage.setItem('autoFocus', e.target.checked);
	if (e.target.checked) {
		document.getElementById('uv-address').focus();
	}
});

document.getElementById('show-errors').addEventListener('change', (e) => {
	localStorage.setItem('showErrors', e.target.checked);
});

document.getElementById('enable-animations').addEventListener('change', (e) => {
	localStorage.setItem('enableAnimations', e.target.checked);
	toggleAnimations(e.target.checked);
});

document.getElementById('enable-particles').addEventListener('change', (e) => {
	localStorage.setItem('enableParticles', e.target.checked);
	toggleParticles(e.target.checked);
});

document.getElementById('ai-personality-select').addEventListener('change', (e) => {
	localStorage.setItem('aiPersonality', e.target.value);
});

document.getElementById('font-size-select').addEventListener('change', (e) => {
	localStorage.setItem('fontSize', e.target.value);
	setFontSize(e.target.value);
});

document.getElementById('clear-cache').addEventListener('click', () => {
	if (confirm('Clear cache? This will reload the page.')) {
		localStorage.clear();
		location.reload();
	}
});

// Load settings on page load
window.addEventListener('load', () => {
	const theme = localStorage.getItem('theme') || 'light';
	switchTheme(theme);
	document.getElementById('search-engine-select').value = localStorage.getItem('searchEngine') || 'https://duckduckgo.com/?q=%s';
	document.getElementById('uv-search-engine').value = localStorage.getItem('searchEngine') || 'https://duckduckgo.com/?q=%s';
	document.getElementById('auto-focus').checked = localStorage.getItem('autoFocus') === 'true';
	document.getElementById('show-errors').checked = localStorage.getItem('showErrors') === 'true';
	document.getElementById('enable-animations').checked = localStorage.getItem('enableAnimations') !== 'false'; // default true
	document.getElementById('enable-particles').checked = localStorage.getItem('enableParticles') === 'true';
	document.getElementById('ai-personality-select').value = localStorage.getItem('aiPersonality') || 'friendly';
	document.getElementById('font-size-select').value = localStorage.getItem('fontSize') || 'medium';
	setFontSize(localStorage.getItem('fontSize') || 'medium');
	toggleAnimations(localStorage.getItem('enableAnimations') !== 'false');
	toggleParticles(document.getElementById('enable-particles').checked);
	if (document.getElementById('auto-focus').checked) {
		document.getElementById('uv-address').focus();
	}
});

function switchTheme(theme) {
	const body = document.body;
	const searchWrapper = document.querySelector('.search-wrapper');
	const setSearchBorder = (value) => {
		if (searchWrapper) {
			searchWrapper.style.setProperty('--search-border', value);
		}
	};
	body.className = ''; // reset
	body.classList.add(theme);
	// Apply theme styles
	if (theme === 'dark-blue') {
		body.style.background = 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(96, 165, 250, 0.2) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(147, 197, 253, 0.4) 0%, transparent 50%), linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)';
		body.style.animation = '';
		document.querySelector('.logo-wrapper h1').style.color = '#1e40af';
		document.querySelector('.desc p').style.color = '#1e3a8a';
		document.querySelector('.top-bar').style.background = 'linear-gradient(180deg, rgba(59, 130, 246, 0.95), rgba(96, 165, 250, 0.98), rgba(59, 130, 246, 0.95))';
		document.querySelector('.settings-panel').style.backgroundColor = '#dbeafe';
		document.querySelector('.settings-panel').style.borderColor = '#3b82f6';
		document.querySelectorAll('.theme-btn, #clear-cache').forEach(btn => { btn.style.backgroundColor = '#3b82f6'; btn.style.color = '#ffffff'; });
		document.getElementById('search-engine-select').style.backgroundColor = '#3b82f6';
		document.getElementById('search-engine-select').style.color = '#ffffff';
		setSearchBorder('conic-gradient(from 0deg, #3b82f6 0deg, #3b82f6 15deg, transparent 15deg 100%)');
	} else if (theme === 'light') {
		body.style.background = 'radial-gradient(circle at 25% 25%, rgba(167, 139, 250, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(196, 181, 253, 0.1) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(216, 180, 254, 0.2) 0%, transparent 50%), linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 50%, #d8b4fe 100%)';
		body.style.animation = '';
		document.querySelector('.logo-wrapper h1').style.color = '#5b21b6';
		document.querySelector('.desc p').style.color = '#374151';
		document.querySelector('.top-bar').style.background = 'radial-gradient(circle at 25% 25%, rgba(167, 139, 250, 0.16) 0%, transparent 48%), linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 255, 0.94))';
		document.querySelector('.settings-panel').style.backgroundColor = '#ffffff';
		document.querySelector('.settings-panel').style.borderColor = '#c084fc';
		document.querySelectorAll('.theme-btn, #clear-cache').forEach(btn => { btn.style.backgroundColor = '#a78bfa'; btn.style.color = '#ffffff'; });
		document.getElementById('search-engine-select').style.backgroundColor = '#a78bfa';
		document.getElementById('search-engine-select').style.color = '#ffffff';
		setSearchBorder('conic-gradient(from 0deg, #a78bfa 0deg, #a78bfa 15deg, transparent 15deg 100%)');
	} else if (theme === 'neon') {
		body.style.background = 'radial-gradient(circle at 30% 70%, rgba(0, 255, 0, 0.12) 0%, transparent 40%), radial-gradient(circle at 70% 30%, rgba(0, 255, 0, 0.06) 0%, transparent 40%), linear-gradient(180deg, #020202 0%, #001118 50%, #000000 100%), repeating-linear-gradient(0deg, rgba(0,255,0,0.03) 0px, rgba(0,255,0,0.03) 1px, transparent 1px 4px)';
		body.style.animation = '';
		document.querySelector('.logo-wrapper h1').style.color = '#00ff00';
		document.querySelector('.desc p').style.color = '#8cff8c';
		document.querySelector('.top-bar').style.background = 'radial-gradient(circle at 50% 25%, rgba(0, 255, 0, 0.1) 0%, transparent 35%), linear-gradient(180deg, rgba(0, 0, 0, 0.94), rgba(0, 25, 30, 0.96))';
		document.querySelector('.settings-panel').style.backgroundColor = '#020202';
		document.querySelector('.settings-panel').style.borderColor = '#00ff00';
		document.querySelectorAll('.theme-btn, #clear-cache').forEach(btn => { btn.style.backgroundColor = '#00ff00'; btn.style.color = '#000000'; });
		document.getElementById('search-engine-select').style.backgroundColor = '#00ff00';
		document.getElementById('search-engine-select').style.color = '#000000';
		setSearchBorder('conic-gradient(from 0deg, #00ff00 0deg, #00ff00 15deg, transparent 15deg 100%)');
	} else if (theme === 'sunset') {
		body.style.background = 'radial-gradient(circle at 20% 20%, rgba(255, 149, 128, 0.22) 0%, transparent 22%), radial-gradient(circle at 80% 40%, rgba(255, 208, 128, 0.18) 0%, transparent 20%), radial-gradient(circle at 40% 80%, rgba(168, 85, 247, 0.14) 0%, transparent 18%), linear-gradient(180deg, #ff9a8d 0%, #f68e8f 25%, #c06c84 50%, #6c5b7b 100%), repeating-linear-gradient(45deg, transparent 0 10px, rgba(255,255,255,0.05) 10px 12px)';
		body.style.animation = '';
		document.querySelector('.logo-wrapper h1').style.color = '#ffffff';
		document.querySelector('.desc p').style.color = '#f9f4ff';
		document.querySelector('.top-bar').style.background = 'radial-gradient(circle at 30% 25%, rgba(251, 191, 36, 0.16) 0%, transparent 40%), linear-gradient(180deg, rgba(112, 63, 176, 0.94), rgba(236, 72, 153, 0.94))';
		document.querySelector('.settings-panel').style.backgroundColor = '#fdf6ff';
		document.querySelector('.settings-panel').style.borderColor = '#f472b6';
		document.querySelectorAll('.theme-btn, #clear-cache').forEach(btn => { btn.style.backgroundColor = '#f472b6'; btn.style.color = '#ffffff'; });
		document.getElementById('search-engine-select').style.backgroundColor = '#f472b6';
		document.getElementById('search-engine-select').style.color = '#ffffff';
		setSearchBorder('conic-gradient(from 0deg, #f472b6 0deg, #f472b6 15deg, transparent 15deg 100%)');
	} else if (theme === 'matrix') {
		body.style.background = 'radial-gradient(circle at 10% 15%, rgba(29, 78, 216, 0.12) 0%, transparent 15%), radial-gradient(circle at 80% 15%, rgba(16, 185, 129, 0.15) 0%, transparent 12%), linear-gradient(180deg, #07150c 0%, #0d2117 50%, #07150c 100%), repeating-linear-gradient(0deg, rgba(16,185,129,0.03) 0px, rgba(16,185,129,0.03) 2px, transparent 2px 4px), repeating-linear-gradient(90deg, rgba(16,185,129,0.02) 0px, rgba(16,185,129,0.02) 2px, transparent 2px 4px)';
		body.style.animation = '';
		document.querySelector('.logo-wrapper h1').style.color = '#7ef9a5';
		document.querySelector('.desc p').style.color = '#a9f1b7';
		document.querySelector('.top-bar').style.background = 'radial-gradient(circle at 30% 20%, rgba(16, 185, 129, 0.14) 0%, transparent 40%), linear-gradient(180deg, rgba(6, 78, 59, 0.94), rgba(8, 112, 74, 0.94))';
		document.querySelector('.settings-panel').style.backgroundColor = '#061b13';
		document.querySelector('.settings-panel').style.borderColor = '#10b981';
		document.querySelectorAll('.theme-btn, #clear-cache').forEach(btn => { btn.style.backgroundColor = '#10b981'; btn.style.color = '#ffffff'; });
		document.getElementById('search-engine-select').style.backgroundColor = '#10b981';
		document.getElementById('search-engine-select').style.color = '#ffffff';
		setSearchBorder('conic-gradient(from 0deg, #10b981 0deg, #10b981 15deg, transparent 15deg 100%)');
	} else if (theme === 'midnight') {
		body.style.background = 'radial-gradient(circle at 30% 20%, rgba(8, 30, 58, 0.9) 0%, transparent 35%), linear-gradient(180deg, #020617 0%, #08132b 50%, #0b203f 100%)';
		body.style.animation = '';
		document.querySelector('.logo-wrapper h1').style.color = '#91e0ff';
		document.querySelector('.desc p').style.color = '#cbd6f5';
		document.querySelector('.top-bar').style.background = 'radial-gradient(circle at 30% 20%, rgba(144, 224, 255, 0.14) 0%, transparent 35%), linear-gradient(180deg, rgba(9, 30, 66, 0.95), rgba(20, 54, 105, 0.96))';
		document.querySelector('.settings-panel').style.backgroundColor = '#111d34';
		document.querySelector('.settings-panel').style.borderColor = '#4f86ff';
		document.querySelectorAll('.theme-btn, #clear-cache').forEach(btn => { btn.style.backgroundColor = '#4f86ff'; btn.style.color = '#ffffff'; });
		document.getElementById('search-engine-select').style.backgroundColor = '#4f86ff';
		document.getElementById('search-engine-select').style.color = '#ffffff';
		setSearchBorder('conic-gradient(from 0deg, #4f86ff 0deg, #4f86ff 15deg, transparent 15deg 100%)');
	} else if (theme === 'aurora') {
		body.style.background = 'radial-gradient(circle at 20% 20%, rgba(131, 196, 253, 0.18) 0%, transparent 35%), radial-gradient(circle at 80% 25%, rgba(167, 139, 250, 0.18) 0%, transparent 30%), linear-gradient(180deg, #0b1a2d 0%, #0e294c 45%, #152e58 100%)';
		body.style.animation = '';
		document.querySelector('.logo-wrapper h1').style.color = '#b3d8ff';
		document.querySelector('.desc p').style.color = '#d8e8ff';
		document.querySelector('.top-bar').style.background = 'radial-gradient(circle at 30% 20%, rgba(167, 139, 250, 0.16) 0%, transparent 40%), linear-gradient(180deg, rgba(15, 41, 84, 0.95), rgba(54, 104, 166, 0.96))';
		document.querySelector('.settings-panel').style.backgroundColor = '#111f33';
		document.querySelector('.settings-panel').style.borderColor = '#7c3aed';
		document.querySelectorAll('.theme-btn, #clear-cache').forEach(btn => { btn.style.backgroundColor = '#7c3aed'; btn.style.color = '#ffffff'; });
		document.getElementById('search-engine-select').style.backgroundColor = '#7c3aed';
		document.getElementById('search-engine-select').style.color = '#ffffff';
		setSearchBorder('conic-gradient(from 0deg, #7c3aed 0deg, #7c3aed 15deg, transparent 15deg 100%)');
	} else if (theme === 'cyber') {
		body.style.background = 'radial-gradient(circle at 10% 10%, rgba(0, 255, 255, 0.12) 0%, transparent 12%), radial-gradient(circle at 85% 20%, rgba(255, 0, 255, 0.08) 0%, transparent 12%), linear-gradient(180deg, #020912 0%, #020b18 60%, #08101f 100%)';
		body.style.animation = '';
		document.querySelector('.logo-wrapper h1').style.color = '#65f4ff';
		document.querySelector('.desc p').style.color = '#9ff8ff';
		document.querySelector('.top-bar').style.background = 'radial-gradient(circle at 10% 10%, rgba(0, 255, 255, 0.14) 0%, transparent 25%), linear-gradient(180deg, rgba(0, 20, 28, 0.94), rgba(0, 61, 94, 0.94))';
		document.querySelector('.settings-panel').style.backgroundColor = '#07111a';
		document.querySelector('.settings-panel').style.borderColor = '#22d3ee';
		document.querySelectorAll('.theme-btn, #clear-cache').forEach(btn => { btn.style.backgroundColor = '#22d3ee'; btn.style.color = '#07111a'; });
		document.getElementById('search-engine-select').style.backgroundColor = '#22d3ee';
		document.getElementById('search-engine-select').style.color = '#07111a';
		setSearchBorder('conic-gradient(from 0deg, #22d3ee 0deg, #22d3ee 15deg, transparent 15deg 100%)');
	} else {
		body.style.background = '';
		body.style.animation = '';
		document.querySelector('.settings-panel').style.backgroundColor = '';
		document.querySelector('.settings-panel').style.borderColor = '';
		document.querySelectorAll('.theme-btn, #clear-cache').forEach(btn => { btn.style.backgroundColor = ''; btn.style.color = ''; });
	}
}

function toggleAnimations(enabled) {
	const elements = document.querySelectorAll('[style*="transition"], [style*="animation"], .logo, .logo-wrapper h1, .desc p, footer a, .settings-btn, .theme-btn, #clear-cache, .setting-group h3');
	elements.forEach(el => {
		if (enabled) {
			el.style.transition = el.style.transition || 'all 0.3s ease';
		} else {
			el.style.transition = 'none';
		}
	});
	const searchWrapper = document.querySelector('.search-wrapper');
	if (searchWrapper) {
		searchWrapper.style.setProperty('--search-border-animation', enabled ? 'spin 2s linear infinite' : 'none');
	}
}

function toggleParticles(enabled) {
	document.body.classList.toggle('particles-enabled', enabled);
}

