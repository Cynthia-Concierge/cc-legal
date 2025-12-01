/**
 * AI Booking Widget
 * Embeddable widget script for businesses
 * 
 * Usage: <script src="https://yourdomain.com/widget.js" data-business="businessId"></script>
 */

(function() {
  'use strict';

  // Configuration
  const WIDGET_API_BASE = window.WIDGET_API_BASE || 'http://localhost:3001';
  const WIDGET_VERSION = '1.0.0';

  // Widget state
  let widgetConfig = null;
  let conversationId = null;
  let isOpen = false;
  let messages = [];

  // Get business ID from script tag
  function getBusinessId() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      if (script.src && script.src.includes('widget.js')) {
        return script.getAttribute('data-business');
      }
    }
    return null;
  }

  // Load business config
  async function loadConfig(businessId) {
    try {
      const response = await fetch(`${WIDGET_API_BASE}/api/business/${businessId}/config`);
      if (!response.ok) {
        throw new Error('Failed to load config');
      }
      const result = await response.json();
      // Add businessId to config for later use
      if (result.data) {
        result.data.businessId = businessId;
      }
      return result.data;
    } catch (error) {
      console.error('Error loading widget config:', error);
      return null;
    }
  }

  // Send chat message
  async function sendMessage(message) {
    if (!widgetConfig) {
      return 'Widget not initialized. Please refresh the page.';
    }

    try {
      const response = await fetch(`${WIDGET_API_BASE}/api/widget/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: widgetConfig.businessId || getBusinessId(),
          message: message,
          conversationId: conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      if (result.data.conversationId) {
        conversationId = result.data.conversationId;
      }
      return result.data.message;
    } catch (error) {
      console.error('Error sending message:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }

  // Create widget UI
  function createWidgetUI() {
    // Create container
    const container = document.createElement('div');
    container.id = 'ai-booking-widget';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    `;

    // Create button
    const button = document.createElement('button');
    button.id = 'widget-toggle';
    button.innerHTML = '💬';
    button.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s;
    `;
    button.onmouseover = () => button.style.transform = 'scale(1.1)';
    button.onmouseout = () => button.style.transform = 'scale(1)';
    button.onclick = toggleWidget;

    // Create chat window
    const chatWindow = document.createElement('div');
    chatWindow.id = 'widget-chat';
    chatWindow.style.cssText = `
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      height: 500px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
    `;

    // Chat header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span>${widgetConfig?.name || 'AI Assistant'}</span>
      <button id="widget-close" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
    `;
    document.getElementById('widget-close')?.addEventListener('click', toggleWidget);

    // Messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.id = 'widget-messages';
    messagesContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    // Input container
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    `;

    const input = document.createElement('input');
    input.id = 'widget-input';
    input.type = 'text';
    input.placeholder = 'Type your message...';
    input.style.cssText = `
      flex: 1;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    `;

    const sendButton = document.createElement('button');
    sendButton.innerHTML = 'Send';
    sendButton.style.cssText = `
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    `;

    sendButton.onclick = async () => {
      const message = input.value.trim();
      if (!message) return;

      // Add user message
      addMessage('user', message);
      input.value = '';

      // Show typing indicator
      const typingId = addMessage('assistant', '...', true);

      // Get response
      const response = await sendMessage(message);
      
      // Remove typing indicator and add response
      removeMessage(typingId);
      addMessage('assistant', response);
    };

    input.onkeypress = (e) => {
      if (e.key === 'Enter') {
        sendButton.onclick();
      }
    };

    inputContainer.appendChild(input);
    inputContainer.appendChild(sendButton);

    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(inputContainer);

    container.appendChild(button);
    container.appendChild(chatWindow);

    document.body.appendChild(container);

    // Add welcome message
    if (widgetConfig) {
      addMessage('assistant', `Hello! I'm the AI receptionist for ${widgetConfig.name}. How can I help you today?`);
    }
  }

  // Toggle widget
  function toggleWidget() {
    isOpen = !isOpen;
    const chatWindow = document.getElementById('widget-chat');
    if (chatWindow) {
      chatWindow.style.display = isOpen ? 'flex' : 'none';
    }
    if (isOpen) {
      document.getElementById('widget-input')?.focus();
    }
  }

  // Add message to chat
  function addMessage(role, content, isTyping = false) {
    const messagesContainer = document.getElementById('widget-messages');
    if (!messagesContainer) return null;

    const messageId = 'msg-' + Date.now() + '-' + Math.random();
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.style.cssText = `
      display: flex;
      ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
      margin-bottom: 8px;
    `;

    const bubble = document.createElement('div');
    bubble.style.cssText = `
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 16px;
      ${role === 'user' 
        ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;' 
        : 'background: #f3f4f6; color: #1f2937;'}
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    `;
    bubble.textContent = content;

    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    messages.push({ id: messageId, role, content });
    return messageId;
  }

  // Remove message
  function removeMessage(messageId) {
    const messageDiv = document.getElementById(messageId);
    if (messageDiv) {
      messageDiv.remove();
    }
    messages = messages.filter(m => m.id !== messageId);
  }

  // Initialize widget
  async function init() {
    const businessId = getBusinessId();
    if (!businessId) {
      console.error('AI Booking Widget: data-business attribute not found');
      return;
    }

    // Load config
    widgetConfig = await loadConfig(businessId);
    if (!widgetConfig) {
      console.error('AI Booking Widget: Failed to load config');
      return;
    }

    // Create UI
    createWidgetUI();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

