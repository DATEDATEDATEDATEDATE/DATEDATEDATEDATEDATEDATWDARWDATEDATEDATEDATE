  const apiUrl = "https://triple.kys.gay/api/Chatgpt/v4/?msg=";
  const rulesUrl = "https://raw.githubusercontent.com/DATEDATEDATEDATEDATE/DATEDATEDATEDATEDATEDATWDARWDATEDATEDATEDATE/refs/heads/main/rules.txt";
  const fallbackRulesUrl = "https://ribbon-amplified-conga.glitch.me/rules.txt";  // URL de fallback

  const chatLog = document.getElementById("chat-log");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");

  let botRules = ""; // Regras carregadas dinamicamente
  let userMessages = [];
  let botMessages = [];
  let isTyping = false; // Flag para controlar se o bot está digitando

  // Função para carregar as regras da URL
  async function loadRules() {
    try {
      const response = await fetch(rulesUrl);
      if (!response.ok) throw new Error(`Erro ao carregar as regras da primeira URL: ${response.status}`);
      botRules = await response.text();
      console.log("Regras carregadas com sucesso da primeira URL.");
    } catch (error) {
      console.error("Erro ao carregar as regras da primeira URL:", error);
      try {
        // Tenta carregar a segunda URL como fallback
        const fallbackResponse = await fetch(fallbackRulesUrl);
        if (!fallbackResponse.ok) throw new Error(`Erro ao carregar as regras da segunda URL: ${fallbackResponse.status}`);
        botRules = await fallbackResponse.text();
        console.log("Regras carregadas com sucesso da URL de fallback.");
      } catch (fallbackError) {
        console.error("Erro ao carregar as regras da URL de fallback:", fallbackError);
        botRules = "Erro ao carregar as regras. Verifique as URLs ou tente novamente.";
      }
    }
  }

  // Função para lidar com respostas do bot e verificar comandos especiais
  function handleBotResponse(text) {
    if (text) {
      const goHrefMatch = text.match(/\{go\s+href=['"]([^'"]+\.html)['"]\}/); // Detecta arquivos HTML
      if (goHrefMatch && goHrefMatch[1]) {
        const page = goHrefMatch[1];
        console.log(`Comando detectado. Redirecionando forçadamente para: ${page}`);
        
        // Força o redirecionamento para o arquivo HTML
        window.location.href = page;  // Redirecionamento imediato
      }
    }
  }

  // Função para rolar automaticamente para o fundo do chat
  function scrollToBottom() {
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  // Função para adicionar mensagens ao chat
  function addMessage(text, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender);
    messageElement.textContent = text;
    chatLog.appendChild(messageElement);
    scrollToBottom();

    // Verifica o comando de redirecionamento se a mensagem for do bot
    if (sender === "bot") {
      handleBotResponse(text); // Processa o comando diretamente
    }
  }

  // Exibe animação de carregamento
  function showLoadingAnimation() {
    const loadingMessage = document.createElement("div");
    loadingMessage.classList.add("message", "loading");
    loadingMessage.textContent = "Gerando";
    chatLog.appendChild(loadingMessage);

    let dotCount = 0;
    loadingMessageInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      loadingMessage.textContent = "Gerando" + ".".repeat(dotCount);
      scrollToBottom();
    }, 500);
  }

  // Remove a animação de carregamento com efeito de fade out
  function removeLoadingAnimation() {
    clearInterval(loadingMessageInterval);
    const loadingMessage = document.querySelector(".message.loading");
    if (loadingMessage) {
      let opacity = 1;
      const fadeOutInterval = requestAnimationFrame(function fadeOut() {
        opacity -= 0.05;
        loadingMessage.style.opacity = opacity;
        if (opacity <= 0) {
          loadingMessage.remove();
        } else {
          requestAnimationFrame(fadeOut);
        }
      });
    }
  }

  // Simula o efeito de digitação de uma resposta
  function simulateTypingEffect(botResponse) {
    isTyping = true; // Marca que o bot está digitando
    const botMessageElement = document.createElement("div");
    botMessageElement.classList.add("message", "bot");
    chatLog.appendChild(botMessageElement);
    scrollToBottom();

    let index = 0;
    botMessageElement.textContent = "";

    typingEffectTimeout = setInterval(() => {
      botMessageElement.textContent += botResponse[index];
      index++;
      if (index === botResponse.length) {
        clearInterval(typingEffectTimeout); // Acaba a animação
        isTyping = false; // Marca que o bot terminou de digitar
        enableUserInput(); // Habilita o input do usuário
      }
      scrollToBottom();
    }, 50); // velocidade da digitação
  }

  // Função para desabilitar o envio enquanto o bot está digitando
  function disableUserInput() {
    userInput.disabled = true;
    sendButton.disabled = true;
  }

  // Função para habilitar o envio após a digitação do bot
  function enableUserInput() {
    userInput.disabled = false;
    sendButton.disabled = false;
  }

  // Envia a mensagem do usuário para a API
  async function sendMessage() {
    const userMessage = userInput.value.trim();
    if (!userMessage || isTyping) return; // Impede envio se o bot estiver digitando

    disableUserInput(); // Desabilita input enquanto o bot está digitando
    addMessage(userMessage, "user");
    userInput.value = "";
    userMessages.push(userMessage);
    if (userMessages.length > 3) userMessages.shift();

    let botContext = `
    ${botRules}
    Últimas 3 mensagens do usuário:
    1. "${userMessages[0] || "nenhuma mensagem anterior"}"
    2. "${userMessages[1] || "nenhuma mensagem anterior"}"
    3. "${userMessages[2] || "nenhuma mensagem anterior"}"
    
    Últimas 2 respostas do bot:
    1. "${botMessages[0] || "nenhuma resposta anterior"}"
    2. "${botMessages[1] || "nenhuma resposta anterior"}"
    
    Pergunta atual do usuário: "${userMessages[userMessages.length - 1]}"
    `;

    showLoadingAnimation();

    try {
      const response = await fetch(apiUrl + encodeURIComponent(botContext), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const data = await response.json();

      removeLoadingAnimation();

      // Verifica o novo formato de resposta da API
      if (data.chat) {
        const botResponse = data.chat;
        simulateTypingEffect(botResponse); // Efeito de digitação
        botMessages.push(botResponse);
        if (botMessages.length > 2) botMessages.shift();
      } else {
        addMessage("Erro: Resposta inválida da API.", "bot");
      }
    } catch (error) {
      removeLoadingAnimation();
      console.error("Erro na comunicação com a API:", error);
      addMessage("Desculpe, estou tendo problemas para processar sua solicitação.", "bot");
    }
  }

  // Eventos
  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") sendMessage();
  });

  // Lógica de scroll para evitar o tremor e vazamento
  chatLog.addEventListener('DOMNodeInserted', () => {
    chatLog.scrollTop = chatLog.scrollHeight;
  });

  // Carrega as regras ao inicializar a página
  window.onload = async () => {
    await loadRules();
    scrollToBottom();
  };
